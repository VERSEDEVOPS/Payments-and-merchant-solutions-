// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { guestRecipient } from "../lib/recipient";
import { CreatorPage } from "./CreatorPage";

const guest = guestRecipient("0x323811A100dBF486909066AA68b8C0E1A609d733");

vi.mock("../lib/onchainCreators", () => ({
  useOnchainCreator: () => ({ creator: guest, isLoading: false }),
}));

vi.mock("../features/tipping/TipComposer", () => ({
  TipComposer: () => <div>Send a tip</div>,
}));

describe("CreatorPage unregistered recipient", () => {
  it("keeps the tip surface open for a wallet with no profile", () => {
    render(
      <MemoryRouter
        initialEntries={["/0x323811A100dBF486909066AA68b8C0E1A609d733"]}
      >
        <Routes>
          <Route path=":slug" element={<CreatorPage />} />
          <Route path="discover" element={<div>Discover</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Unregistered")).toBeTruthy();
    expect(screen.getByText(/tips are waiting at this wallet/i)).toBeTruthy();
    expect(screen.getByText("Send a tip")).toBeTruthy();
    expect(screen.queryByText("Discover")).toBeNull();
  });
});
