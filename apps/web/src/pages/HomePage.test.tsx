// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { creators as demoCreators } from "../lib/data";
import { HomePage } from "./HomePage";

vi.mock("../lib/onchainCreators", () => ({
  useCreatorCatalog: () => ({ creators: demoCreators, isFallback: true }),
}));

describe("HomePage settlement scene", () => {
  it("keeps the supporter-to-creator fxVERSE path readable", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByLabelText(
        /fxVERSE tip moving from a supporter to a creator and settling on Polygon/i,
      ),
    ).toBeTruthy();
    expect(screen.getByText("0x34…a2Bd")).toBeTruthy();
    expect(screen.getAllByText("Maya Okafor").length).toBeGreaterThan(0);
    expect(screen.getByText("Illustrative transaction")).toBeTruthy();
    expect(document.querySelector(".hero-atmosphere")).toBeTruthy();
  });
});
