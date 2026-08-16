import { getAddress, keccak256, stringToBytes, zeroAddress, type Address, type Hex } from "viem";

export const CREATOR_CATEGORIES = [
  "Builder",
  "Product design",
  "Open source",
  "Visual art",
  "Education",
  "Community",
  "Music",
  "Writing",
] as const;

export type CreatorCategory = (typeof CREATOR_CATEGORIES)[number];

export function isCreatorCategory(value: unknown): value is CreatorCategory {
  return (
    typeof value === "string" &&
    (CREATOR_CATEGORIES as readonly string[]).includes(value)
  );
}

export function normalizeProfileSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function profileSlugHash(slug: string): Hex {
  return keccak256(stringToBytes(slug));
}

export function profileSlugCandidates(name: string, wallet: Address): string[] {
  const base = normalizeProfileSlug(name).slice(0, 23);
  const short = wallet.slice(2, 8).toLowerCase();
  const tail = wallet.slice(-4).toLowerCase();
  const candidates: string[] = [];
  const push = (value: string) => {
    const slug = normalizeProfileSlug(value);
    if (slug.length >= 3 && slug.length <= 32 && !candidates.includes(slug)) {
      candidates.push(slug);
    }
  };
  if (base.length >= 3) {
    push(base);
    push(`${base}-${tail}`);
    push(`${base}-${short}`);
  }
  push(`creator-${short}`);
  return candidates;
}

export async function allocateProfileSlug(
  candidates: string[],
  wallet: Address,
  ownerOf: (slugHash: Hex) => Promise<Address>,
): Promise<string> {
  const publisher = getAddress(wallet);
  for (const slug of candidates) {
    const owner = await ownerOf(profileSlugHash(slug));
    if (owner === zeroAddress || getAddress(owner) === publisher) {
      return slug;
    }
  }
  throw new Error("Could not allocate a unique profile slug.");
}
