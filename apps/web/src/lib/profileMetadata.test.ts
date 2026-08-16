import { describe, expect, it } from "vitest";
import { getAddress, zeroAddress, type Address, type Hex } from "viem";
import {
  allocateProfileSlug,
  profileSlugCandidates,
  profileSlugHash,
} from "./profileMetadata";

const wallet = "0x323811A100dBF486909066AA68b8C0E1A609d733" as Address;

describe("automatic profile slugs", () => {
  it("builds a readable slug from the display name first", () => {
    expect(profileSlugCandidates("melody_pm", wallet)[0]).toBe("melody-pm");
  });

  it("falls back to a wallet-unique slug when the name is empty", () => {
    const candidates = profileSlugCandidates("  ", wallet);
    expect(candidates[0]).toMatch(/^creator-[a-f0-9]{6}$/);
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("allocates the first unused slug and skips slugs owned by someone else", async () => {
    const owners = new Map<Hex, Address>([
      [
        profileSlugHash("melody-pm"),
        getAddress("0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24"),
      ],
    ]);
    const slug = await allocateProfileSlug(
      profileSlugCandidates("melody_pm", wallet),
      wallet,
      async (slugHash) => owners.get(slugHash) ?? zeroAddress,
    );
    expect(slug).not.toBe("melody-pm");
    expect(slug.startsWith("melody-pm-")).toBe(true);
  });
});
