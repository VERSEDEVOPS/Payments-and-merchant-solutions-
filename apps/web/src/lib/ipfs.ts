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
