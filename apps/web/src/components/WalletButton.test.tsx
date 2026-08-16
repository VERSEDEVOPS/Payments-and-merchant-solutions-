// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletButton } from "./WalletButton";

const account = "0x1234567890abcdef1234567890abcdef12345678" as const;
const walletState = {
  address: account as `0x${string}` | undefined,
  isConnected: true,
};
const openAppKit = vi.fn();

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();
  return {
    ...actual,
    useAccount: () => ({
      address: walletState.address,
      isConnected: walletState.isConnected,
    }),
    useDisconnect: () => ({ disconnect: vi.fn() }),
  };
});

vi.mock("@reown/appkit/react", () => ({
  useAppKit: () => ({ open: openAppKit }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

vi.mock("../lib/onchainCreators", () => ({
  useCreatorCatalog: () => ({
    creators: [
      {
        slug: "lola-builds",
        name: "Lola Builds",
        handle: "@lolabuilds",
        bio: "Making everyday payments feel effortless.",
        address: account,
        initials: "LB",
        accent: "violet",
        verified: false,
        supporters: 0,
        raised: 0,
        goal: 1,
        campaign: "No active campaign",
        category: "Builder",
        isDemo: false,
      },
    ],
    isLoading: false,
    isFallback: false,
  }),
}));

describe("WalletButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens Reown AppKit instead of listing injected connectors", () => {
    walletState.address = undefined;
    walletState.isConnected = false;
    openAppKit.mockClear();

    render(
      <MemoryRouter>
        <WalletButton />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(openAppKit).toHaveBeenCalledWith({ view: "Connect" });
    expect(screen.queryByText(/choose a self-custodial wallet/i)).toBeNull();
    expect(screen.queryByText("Injected")).toBeNull();
  });

  it("expands account details from the connected wallet chip", () => {
    walletState.address = account;
    walletState.isConnected = true;
    render(
      <MemoryRouter>
        <WalletButton />
      </MemoryRouter>,
    );

    const chip = screen.getByRole("button", { name: /0x1234/i });
    fireEvent.click(chip);

    expect(chip.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("heading", { name: "Your profile" })).toBeTruthy();
    expect(screen.getByText("Lola Builds")).toBeTruthy();
    expect(screen.getByText("@lolabuilds")).toBeTruthy();
    expect(screen.getByText("Making everyday payments feel effortless.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /view public profile/i }).getAttribute("href"),
    ).toBe("/lola-builds");
    expect(document.querySelector(".wallet-drawer-overlay")).toBeNull();
    expect(screen.getByRole("button", { name: /0x1234/i })).toBeTruthy();
  });
});
