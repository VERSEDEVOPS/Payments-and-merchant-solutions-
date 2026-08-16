// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileEditor } from "./ProfileEditor";

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();
  return {
    ...actual,
    useAccount: () => ({ address: undefined, chainId: undefined }),
    usePublicClient: () => undefined,
    useSignMessage: () => ({ signMessageAsync: vi.fn() }),
    useWaitForTransactionReceipt: () => ({
      isLoading: false,
      isSuccess: false,
    }),
    useWriteContract: () => ({
      data: undefined,
      error: undefined,
      isPending: false,
      writeContract: vi.fn(),
      writeContractAsync: vi.fn(),
    }),
  };
});

describe("ProfileEditor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("offers controlled creator categories and keeps the selected value", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileEditor />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Profile" }));

    const category = await screen.findByRole<HTMLSelectElement>("combobox", {
      name: "Category",
    });
    expect(Array.from(category.options, (option) => option.text)).toEqual([
      "Builder",
      "Product design",
      "Open source",
      "Visual art",
      "Education",
      "Community",
      "Music",
      "Writing",
    ]);

    fireEvent.change(category, { target: { value: "Visual art" } });
    expect(category.value).toBe("Visual art");
  });
});
