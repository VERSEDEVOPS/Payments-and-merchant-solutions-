// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EcosystemPage } from "./EcosystemPage";

describe("EcosystemPage token mark", () => {
  it("renders the official Verse token mark instead of a generic letter V", () => {
    const { container } = render(<EcosystemPage />);

    expect(screen.getByRole("img", { name: /fxVERSE token/i })).toBeTruthy();
    expect(container.querySelector(".ecosystem-orbit")?.querySelector("svg.verse-token-mark")).toBeTruthy();
    expect(container.querySelector(".ecosystem-orbit > span")).toBeNull();
  });
});
