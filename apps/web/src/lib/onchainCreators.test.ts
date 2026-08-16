import { describe, expect, it } from "vitest";
import { keccak256, stringToBytes } from "viem";
import {
  isProfileMetadata,
  isProfileMetadataForRecord,
} from "./onchainCreators";

const validProfile = {
  version: 1,
  kind: "profile",
  slug: "maya-builds",
  name: "Maya Okafor",
  bio: "Building useful self-custody tools.",
  category: "Product design",
  image: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ptw52sdbf7z3m4vza5xohzti",
  publisher: "0x2C0552e5dCb79B064Fd23E358A86810BC5994244",
};

describe("onchain profile metadata boundary", () => {
  it("accepts the documented profile schema", () => {
    expect(isProfileMetadata(validProfile)).toBe(true);
  });

  it("rejects mutable gateway URLs", () => {
    expect(
      isProfileMetadata({
        ...validProfile,
        image: "https://gateway.example/ipfs/changeable",
      }),
    ).toBe(false);
  });

  it("rejects malformed publishers and slugs", () => {
    expect(isProfileMetadata({ ...validProfile, publisher: "0x1234" })).toBe(
      false,
    );
    expect(isProfileMetadata({ ...validProfile, slug: "Maya Builds" })).toBe(
      false,
    );
  });

  it("binds metadata to the registered wallet and slug hash", () => {
    const publisher = validProfile.publisher as `0x${string}`;
    const slugHash = keccak256(stringToBytes(validProfile.slug));
    expect(
      isProfileMetadataForRecord(validProfile, publisher, slugHash),
    ).toBe(true);
    expect(
      isProfileMetadataForRecord(
        { ...validProfile, slug: "another-profile" },
        publisher,
        slugHash,
      ),
    ).toBe(false);
    expect(
      isProfileMetadataForRecord(
        validProfile,
        "0x0000000000000000000000000000000000000001",
        slugHash,
      ),
    ).toBe(false);
  });

  it("rejects categories outside the controlled taxonomy", () => {
    expect(isProfileMetadata({ ...validProfile, category: "Buidler" })).toBe(
      false,
    );
  });
});
