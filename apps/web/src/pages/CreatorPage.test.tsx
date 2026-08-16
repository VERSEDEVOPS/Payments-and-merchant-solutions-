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

vi.mock("../lib/onchainSupport", () => ({
  useRecentSupport: () => ({
    data: [
      {
        hash: "0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16",
        from: "0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24",
        amount: 10_000n * 10n ** 18n,
        rail: "direct",
        timestamp: Math.floor(Date.now() / 1000) - 120,
      },
    ],
    isLoading: false,
  }),
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
    expect(screen.getByText(/send to a wallet/i)).toBeTruthy();
    expect(
      screen.getByText("0x323811A100dBF486909066AA68b8C0E1A609d733"),
    ).toBeTruthy();
    expect(screen.getByText("Send a tip")).toBeTruthy();
    expect(screen.queryByText("Discover")).toBeNull();
    const tx = screen.getByRole("link", { name: /0x8a73e82a/i });
    expect(tx.getAttribute("href")).toContain(
      "0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16",
    );
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
