import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  isAddress,
  type Hex,
} from "viem";
import { polygon } from "viem/chains";
import { z } from "zod";
import { json } from "./storage";

const claimRequestSchema = z
  .object({
    creator: z.string(),
    to: z.string(),
    amount: z.string().regex(/^\d{1,78}$/),
    deadline: z.number().int().positive(),
    signature: z
      .string()
      .max(2_050)
      .regex(/^0x(?:[0-9a-fA-F]{2})+$/),
  })
  .strict();

const claimAbi = [
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimWithSignature",
    stateMutability: "nonpayable",
    inputs: [
      { name: "creator", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export interface ClaimEnv {
  CLAIM_RATE_LIMITER: RateLimit;
  MAX_SPONSORED_CLAIM_WEI: string;
  POLYGON_RPC_URL: string;
  RELAYER_COORDINATOR: DurableObjectNamespace;
  RELAYER_PRIVATE_KEY: string;
  TIP_VAULT_ADDRESS: string;
}

export async function routeClaimRelay(request: Request, env: ClaimEnv) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "The claim request must be valid JSON." }, 400);
  }

  const result = claimRequestSchema.safeParse(payload);
  if (!result.success || !isAddress(result.data.creator)) {
    return json({ error: "The sponsored claim is malformed." }, 400);
  }
  const creator = getAddress(result.data.creator);
  const rateLimit = await env.CLAIM_RATE_LIMITER.limit({ key: creator });
  if (!rateLimit.success) {
    return json(
      { error: "Too many claim attempts. Try again in one minute." },
      429,
    );
  }

  const coordinator = env.RELAYER_COORDINATOR.getByName("polygon-mainnet");
  return coordinator.fetch("https://relay.internal/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result.data),
  });
}

export class RelayerCoordinator implements DurableObject {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: ClaimEnv,
  ) {
    void this.state;
  }

  async fetch(request: Request): Promise<Response> {
    const previous = this.queue;
    let release = () => {};
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await this.submitClaim(request);
    } finally {
      release();
    }
  }

  private async submitClaim(request: Request): Promise<Response> {
    const parsed = claimRequestSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid claim request." }, 400);
    if (
      !isAddress(parsed.data.creator) ||
      !isAddress(parsed.data.to) ||
      !isAddress(this.env.TIP_VAULT_ADDRESS)
    ) {
      return json({ error: "Invalid claim address." }, 400);
    }
    if (!/^0x[0-9a-fA-F]{64}$/.test(this.env.RELAYER_PRIVATE_KEY)) {
      return json({ error: "The claim relayer has not been configured." }, 503);
    }

    const creator = getAddress(parsed.data.creator);
    const to = getAddress(parsed.data.to);
    const vault = getAddress(this.env.TIP_VAULT_ADDRESS);
    const amount = BigInt(parsed.data.amount);
    const now = Math.floor(Date.now() / 1_000);
    if (to !== creator) {
      return json(
        { error: "Sponsored claims can only be paid to the signing wallet." },
        400,
      );
    }
    if (amount <= 0n || amount > BigInt(this.env.MAX_SPONSORED_CLAIM_WEI)) {
      return json({ error: "The claim exceeds the sponsorship limit." }, 400);
    }
    if (parsed.data.deadline < now || parsed.data.deadline > now + 15 * 60) {
      return json(
        { error: "The claim deadline is outside the allowed window." },
        400,
      );
    }

    const account = privateKeyToAccount(this.env.RELAYER_PRIVATE_KEY as Hex);
    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(this.env.POLYGON_RPC_URL),
    });
    const walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(this.env.POLYGON_RPC_URL),
    });
    const available = await publicClient.readContract({
      address: vault,
      abi: claimAbi,
      functionName: "claimable",
      args: [creator],
    });
    if (amount > available) {
      return json(
        { error: "The requested amount is no longer claimable." },
        409,
      );
    }

    try {
      const simulation = await publicClient.simulateContract({
        account,
        address: vault,
        abi: claimAbi,
        functionName: "claimWithSignature",
        args: [
          creator,
          to,
          amount,
          BigInt(parsed.data.deadline),
          parsed.data.signature as Hex,
        ],
      });
      const transactionHash = await walletClient.writeContract(
        simulation.request,
      );
      return json({ transactionHash });
    } catch (error) {
      console.error("claim_relay_failed", { creator, error });
      return json(
        {
          error:
            "The signed claim could not be simulated or submitted on Polygon.",
        },
        422,
      );
    }
  }
}
