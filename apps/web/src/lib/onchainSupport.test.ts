import { describe, expect, it } from "vitest";
import { sortSupportItems, type SupportItem } from "./onchainSupport";

describe("recent support", () => {
  it("orders tips by newest first and keeps the transaction hash", () => {
    const older: SupportItem = {
      hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
      from: "0x323811A100dBF486909066AA68b8C0E1A609d733",
      amount: 5_000n,
      rail: "direct",
      timestamp: 100,
    };
    const newer: SupportItem = {
      hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      from: "0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24",
      amount: 10_000n,
      rail: "vault",
      timestamp: 200,
    };
    expect(sortSupportItems([older, newer]).map((item) => item.hash)).toEqual([
      newer.hash,
      older.hash,
    ]);
  });
});
