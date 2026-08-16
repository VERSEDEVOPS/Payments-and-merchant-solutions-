// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { creators as demoCreators } from "../lib/data";
import { DiscoverPage } from "./DiscoverPage";

vi.mock("../lib/onchainCreators", () => ({
  useCreatorCatalog: () => ({ creators: demoCreators, isFallback: true }),
}));

describe("DiscoverPage filters", () => {
  it("filters creator cards by category and can clear the selection", () => {
    render(
      <MemoryRouter>
        <DiscoverPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /all categories/i }));
    fireEvent.click(screen.getByRole("button", { name: /open source.*1 creator/i }));

    expect(screen.getByText("Ada Mensah")).toBeTruthy();
    expect(screen.queryByText("Maya Okafor")).toBeNull();
    expect(screen.getByRole("button", { name: /open source/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /clear filter/i }));
    expect(screen.getByText("Maya Okafor")).toBeTruthy();
    expect(screen.getByText("Kola Frames")).toBeTruthy();
  });
});
