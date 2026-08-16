import { describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { guestRecipient, parseRecipientAddress } from "./recipient";

const raw = "0x323811a100dbf486909066aa68b8c0e1a609d733";

describe("unregistered recipients", () => {
  it("accepts a wallet address as a tip destination", () => {
    expect(parseRecipientAddress(raw)).toBe(getAddress(raw));
    expect(parseRecipientAddress("melody-builds")).toBeUndefined();
  });

  it("builds a tippable guest profile that is not a demo", () => {
    const guest = guestRecipient(raw);
    expect(guest.isDemo).toBe(false);
    expect(guest.unregistered).toBe(true);
    expect(guest.address).toBe(getAddress(raw));
    expect(guest.slug).toBe(getAddress(raw));
  });
});
