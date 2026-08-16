import { STORAGE_API_URL } from "./config";

const PUBLIC_GATEWAYS = [
  "https://storacha.link/ipfs/",
  "https://w3s.link/ipfs/",
  "https://ipfs.io/ipfs/",
];

export function ipfsGateways(): string[] {
  const worker = STORAGE_API_URL.replace(/\/$/, "");
  const primary = worker ? [`${worker}/ipfs/`] : [];
  return [...primary, ...PUBLIC_GATEWAYS];
}

export async function fetchIpfsJson(cid: string): Promise<unknown> {
  const [primary, ...fallbacks] = ipfsGateways();
  const attempt = async (gateway: string) => {
    const response = await fetch(`${gateway}${cid}`, {
      signal: AbortSignal.timeout(6_000),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("IPFS gateway failed");
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > 64_000) throw new Error("Metadata exceeds limit");
    return response.json() as Promise<unknown>;
  };
  if (primary) {
    try {
      return await attempt(primary);
    } catch {
      // Public gateways are fallbacks only. Storacha/w3s often 301 or fail DNS.
    }
  }
  return Promise.any(fallbacks.map(attempt));
}
