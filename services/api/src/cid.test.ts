import { describe, expect, it } from "vitest";
import { cidFromBytes, isRawCidv1 } from "./cid";

describe("cidFromBytes", () => {
  it("returns a stable CIDv1 raw SHA-256 string", async () => {
    const first = await cidFromBytes(new TextEncoder().encode("versetip"));
    const second = await cidFromBytes(new TextEncoder().encode("versetip"));
    expect(first).toBe(second);
    expect(first.startsWith("bafkrei")).toBe(true);
    expect(isRawCidv1(first)).toBe(true);
  });

  it("changes when the bytes change", async () => {
    const a = await cidFromBytes(new Uint8Array([1, 2, 3]));
    const b = await cidFromBytes(new Uint8Array([1, 2, 4]));
    expect(a).not.toBe(b);
  });

  it("rejects unsafe object keys", () => {
    expect(isRawCidv1("../secret")).toBe(false);
    expect(isRawCidv1("QmHashThatIsCIDv0")).toBe(false);
  });
});
