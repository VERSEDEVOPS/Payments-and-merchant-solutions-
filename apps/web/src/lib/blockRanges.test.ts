import { describe, expect, it } from "vitest";
import { logBlockRanges } from "./blockRanges";

describe("logBlockRanges", () => {
  it("splits a range that exceeds the public RPC log limit", () => {
    const ranges = logBlockRanges(92_127_803n, 92_185_736n, 10_000n);
    expect(ranges.length).toBeGreaterThan(1);
    expect(ranges[0]).toEqual({
      fromBlock: 92_127_803n,
      toBlock: 92_137_802n,
    });
    expect(ranges.at(-1)?.toBlock).toBe(92_185_736n);
    for (const range of ranges) {
      expect(range.toBlock - range.fromBlock + 1n).toBeLessThanOrEqual(10_000n);
    }
  });

  it("keeps a short range in one request", () => {
    expect(logBlockRanges(10n, 20n, 10_000n)).toEqual([
      { fromBlock: 10n, toBlock: 20n },
    ]);
  });
});
