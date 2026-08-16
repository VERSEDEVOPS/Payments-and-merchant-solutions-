import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";

export async function cidFromBytes(bytes: Uint8Array): Promise<string> {
  const digest = await sha256.digest(bytes);
  return CID.createV1(raw.code, digest).toString();
}

export function isRawCidv1(value: string): boolean {
  return /^b[a-z2-7]{50,96}$/.test(value);
}
