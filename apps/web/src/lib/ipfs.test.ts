import { describe, expect, it } from "vitest";
import { ipfsGateways } from "./ipfs";

describe("ipfsGateways", () => {
  it("puts the Worker gateway first when storage is configured", () => {
    const [first] = ipfsGateways();
    expect(first?.endsWith("/ipfs/")).toBe(true);
    expect(first?.startsWith("http")).toBe(true);
  });
});
