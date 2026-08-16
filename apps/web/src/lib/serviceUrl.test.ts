import { describe, expect, it } from "vitest";
import { publicServiceUrl } from "./serviceUrl";

describe("publicServiceUrl", () => {
  it("keeps loopback Worker URLs available during local development", () => {
    expect(publicServiceUrl("http://localhost:8787", false)).toBe(
      "http://localhost:8787",
    );
  });

  it("rejects loopback Worker URLs in production", () => {
    expect(publicServiceUrl("http://localhost:8787", true)).toBe("");
    expect(publicServiceUrl("http://127.0.0.1:8787", true)).toBe("");
    expect(publicServiceUrl("http://[::1]:8787", true)).toBe("");
  });

  it("accepts HTTPS and same-origin service URLs in production", () => {
    expect(publicServiceUrl("https://api.versetip.example/", true)).toBe(
      "https://api.versetip.example",
    );
    expect(publicServiceUrl("/api/", true)).toBe("/api");
  });

  it("rejects malformed service URLs", () => {
    expect(publicServiceUrl("not a URL", true)).toBe("");
  });
});
