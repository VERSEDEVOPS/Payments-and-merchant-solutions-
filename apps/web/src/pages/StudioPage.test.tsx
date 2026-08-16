// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StudioPage } from "./StudioPage";

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();
  return {
    ...actual,
    useAccount: () => ({
      address: "0x323811A100dBF486909066AA68b8C0E1A609d733",
      isConnected: true,
      chainId: 137,
    }),
    useReadContract: () => ({ data: 0n, refetch: vi.fn() }),
    useWriteContract: () => ({
      writeContract: vi.fn(),
      data: undefined,
      isPending: false,
      error: null,
    }),
    useSignTypedData: () => ({ signTypedDataAsync: vi.fn() }),
    useWaitForTransactionReceipt: () => ({
      isSuccess: false,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock("../lib/onchainStudio", () => ({
  useOnchainStudio: () => ({ isPending: false, data: undefined }),
}));

vi.mock("../components/WalletButton", () => ({
  WalletButton: () => null,
}));

vi.mock("../features/profile/ProfileEditor", () => ({
  ProfileEditor: () => null,
}));

vi.mock("../features/campaigns/CampaignEditor", () => ({
  CampaignEditor: () => null,
}));

describe("StudioPage claim copy", () => {
  it("explains the wallet-paid and gasless claim paths", () => {
    render(
      <MemoryRouter>
        <StudioPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /claim — you pay gas/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /claim — we pay gas/i })).toBeTruthy();
    expect(
      screen.getByText(/the first uses your POL/i),
    ).toBeTruthy();
  });
});
