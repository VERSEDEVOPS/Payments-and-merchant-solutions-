// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guestRecipient } from "../lib/recipient";
import { CreatorPage } from "./CreatorPage";

const guest = guestRecipient("0x323811A100dBF486909066AA68b8C0E1A609d733");
const creatorState = { creator: guest };

vi.mock("../lib/onchainCreators", () => ({
  useOnchainCreator: () => ({
    creator: creatorState.creator,
    isLoading: false,
  }),
}));

vi.mock("../features/tipping/TipComposer", () => ({
  TipComposer: () => <div>Send a tip</div>,
}));

describe("CreatorPage unregistered recipient", () => {
  beforeEach(() => {
    creatorState.creator = guest;
  });

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

  it("renders the profile photo instead of initials", () => {
    creatorState.creator = {
      ...guest,
      name: "melody_pm",
      unregistered: false,
      image: "https://example.com/melody.png",
    };
    render(
      <MemoryRouter initialEntries={["/melody-builds"]}>
        <Routes>
          <Route path=":slug" element={<CreatorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const photo = screen.getByRole("img", { name: "melody_pm" });
    expect(photo.getAttribute("src")).toBe("https://example.com/melody.png");
    expect(document.querySelector(".creator-banner-photo")).toBeTruthy();
  });
});
