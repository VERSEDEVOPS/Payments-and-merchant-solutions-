import { describe, expect, it } from "vitest";
import {
  compactNumber,
  readableError,
  relativeTime,
  shortAddress,
  shortHash,
} from "./format";

describe("display formatting", () => {
  it("formats token totals compactly", () => {
    expect(compactNumber(842_500)).toBe("842.5K");
    expect(compactNumber(1_000_000n)).toBe("1M");
  });

  it("shortens transaction hashes for display", () => {
    expect(
      shortHash(
        "0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16",
      ),
    ).toBe("0x8a73e82a…eb16");
  });

  it("formats relative timestamps", () => {
    expect(relativeTime(1_000, 1_960_000)).toBe("16m");
    expect(relativeTime(1_000, 1_000)).toBe("0s");
  });

  it("shortens EVM addresses without changing their ends", () => {
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
    expect(shortAddress()).toBe("");
  });

  it("turns common wallet errors into useful copy", () => {
    expect(readableError(new Error("User rejected request"))).toContain(
      "declined",
    );
    expect(readableError(new Error("insufficient funds"))).toContain("POL");
    expect(readableError(new Error("transfer amount exceeds balance"))).toContain(
      "VERSE",
    );
  });
});
