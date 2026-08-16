import { getAddress, isAddress, type Address } from "viem";
import type { Creator } from "./data";
import { shortAddress } from "./format";

export function parseRecipientAddress(
  value: string | undefined,
): Address | undefined {
  if (!value || !isAddress(value)) return undefined;
  return getAddress(value);
}

export function guestRecipient(address: Address): Creator {
  const checksummed = getAddress(address);
  return {
    slug: checksummed,
    name: shortAddress(checksummed),
    handle: "Unregistered wallet",
    bio: "This wallet has not published a VerseTip profile yet. Direct tips arrive immediately. Vault tips stay here until they connect and claim.",
    address: checksummed,
    initials: checksummed.slice(2, 4).toUpperCase(),
    accent: "blue",
    verified: false,
    supporters: 0,
    raised: 0,
    goal: 1,
    campaign: "No campaign yet",
    category: "Wallet",
    isDemo: false,
    unregistered: true,
  };
}
