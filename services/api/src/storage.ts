import {
  concat,
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  stringToBytes,
} from "viem";
import { polygon } from "viem/chains";
import { z } from "zod";
import { cidFromBytes } from "./cid";

export interface StorageEnv {
  ALLOWED_ORIGIN: string;
  POLYGON_RPC_URL: string;
  METADATA_BUCKET: R2Bucket;
  UPLOAD_RATE_LIMITER: RateLimit;
}

const CREATOR_CATEGORIES = [
  "Builder",
  "Product design",
  "Open source",
  "Visual art",
  "Education",
  "Community",
  "Music",
  "Writing",
] as const;

const profileSchema = z
  .object({
    version: z.literal(1),
    kind: z.literal("profile"),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(32),
    name: z.string().trim().min(1).max(80),
    bio: z.string().trim().min(1).max(500),
    category: z.enum(CREATOR_CATEGORIES),
    xHandle: z.string().trim().max(32).optional(),
    website: z.url().max(200).optional(),
  })
  .strict();

const campaignSchema = z
  .object({
    version: z.literal(1),
    kind: z.literal("campaign"),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(32),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1_000),
    goal: z.string().regex(/^\d{1,78}$/),
  })
  .strict();

const metadataSchema = z.discriminatedUnion("kind", [
  profileSchema,
  campaignSchema,
]);

const MAX_REQUEST_BYTES = 5_300_000;
const MAX_IMAGE_BYTES = 5_000_000;
const MAX_METADATA_BYTES = 12_000;
const SIGNATURE_WINDOW_SECONDS = 5 * 60;

export async function handleStorageUpload(
  request: Request,
  env: StorageEnv,
): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "Upload exceeds the 5 MB limit." }, 413);
  }

  const walletValue = request.headers.get("x-versetip-wallet") ?? "";
  const signature = request.headers.get("x-versetip-signature") ?? "";
  const issuedAtValue = request.headers.get("x-versetip-issued-at") ?? "";
  if (
    !isAddress(walletValue) ||
    signature.length > 2_050 ||
    !/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)
  ) {
    return json({ error: "A valid wallet signature is required." }, 401);
  }

  const issuedAt = Number(issuedAtValue);
  const now = Math.floor(Date.now() / 1_000);
  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 60 ||
    issuedAt < now - SIGNATURE_WINDOW_SECONDS
  ) {
    return json({ error: "The upload signature has expired." }, 401);
  }

  const wallet = getAddress(walletValue);
  const rateLimit = await env.UPLOAD_RATE_LIMITER.limit({ key: wallet });
  if (!rateLimit.success) {
    return json({ error: "Too many uploads. Try again in one minute." }, 429);
  }

  const form = await request.formData();
  const metadataValue = form.get("metadata");
  const imageValue = form.get("image");
  if (typeof metadataValue !== "string" || !(imageValue instanceof File)) {
    return json({ error: "Both metadata and an image are required." }, 400);
  }
  if (new TextEncoder().encode(metadataValue).byteLength > MAX_METADATA_BYTES) {
    return json({ error: "Metadata is too large." }, 413);
  }
  if (imageValue.size <= 0 || imageValue.size > MAX_IMAGE_BYTES) {
    return json({ error: "The image must be between 1 byte and 5 MB." }, 413);
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(imageValue.type)) {
    return json(
      { error: "Only JPEG, PNG, and WebP images are accepted." },
      415,
    );
  }

  let metadata: z.infer<typeof metadataSchema>;
  try {
    metadata = metadataSchema.parse(JSON.parse(metadataValue));
  } catch {
    return json({ error: "Metadata does not match the VerseTip schema." }, 400);
  }

  const imageBytes = new Uint8Array(await imageValue.arrayBuffer());
  if (!hasExpectedImageSignature(imageBytes, imageValue.type)) {
    return json(
      { error: "The image contents do not match its media type." },
      415,
    );
  }

  const contentHash = keccak256(
    concat([stringToBytes(metadataValue), imageBytes]),
  );
  const message = uploadMessage({
    wallet,
    kind: metadata.kind,
    contentHash,
    issuedAt,
  });
  const publicClient = createPublicClient({
    chain: polygon,
    transport: http(env.POLYGON_RPC_URL),
  });
  const signatureValid = await publicClient.verifyMessage({
    address: wallet,
    message,
    signature: signature as `0x${string}`,
  });
  if (!signatureValid) {
    return json({ error: "The upload signature is invalid." }, 401);
  }

  if (!env.METADATA_BUCKET) {
    return json({ error: "Storage has not been configured." }, 503);
  }

  const imageCid = await putAddressedObject(
    env.METADATA_BUCKET,
    imageBytes,
    imageValue.type,
  );
  const metadataDocument = {
    ...metadata,
    image: `ipfs://${imageCid}`,
    publisher: wallet,
  };
  const metadataBytes = new TextEncoder().encode(
    JSON.stringify(metadataDocument),
  );
  const metadataCid = await putAddressedObject(
    env.METADATA_BUCKET,
    metadataBytes,
    "application/json",
  );

  return json({
    metadataURI: `ipfs://${metadataCid}`,
    imageURI: `ipfs://${imageCid}`,
  });
}

export async function readAddressedObject(
  env: StorageEnv,
  cid: string,
): Promise<Response> {
  const object = await env.METADATA_BUCKET.get(`cid/${cid}`);
  if (!object) return json({ error: "Not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

async function putAddressedObject(
  bucket: R2Bucket,
  bytes: Uint8Array,
  contentType: string,
) {
  const cid = await cidFromBytes(bytes);
  await bucket.put(`cid/${cid}`, bytes, {
    httpMetadata: { contentType },
  });
  return cid;
}

export function uploadMessage(input: {
  wallet: `0x${string}`;
  kind: "profile" | "campaign";
  contentHash: `0x${string}`;
  issuedAt: number;
}): string {
  return [
    "Publish public VerseTip metadata",
    `Wallet: ${input.wallet}`,
    `Kind: ${input.kind}`,
    `Content hash: ${input.contentHash}`,
    `Issued at: ${input.issuedAt}`,
    "Chain ID: 137",
  ].join("\n");
}

function hasExpectedImageSignature(bytes: Uint8Array, mediaType: string) {
  if (mediaType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (mediaType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
  }
  return (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}

export function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
