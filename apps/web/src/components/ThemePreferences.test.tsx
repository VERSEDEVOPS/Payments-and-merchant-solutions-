// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemePreferences } from "./ThemePreferences";

const setPreference = vi.hoisted(() => vi.fn());

vi.mock("./useTheme", () => ({
  useTheme: () => ({
    preference: "dark",
    resolvedTheme: "dark",
    setPreference,
  }),
}));

describe("ThemePreferences", () => {
  beforeEach(() => setPreference.mockClear());

  it("opens a compact appearance chooser and changes the selected theme", () => {
    render(<ThemePreferences />);

    fireEvent.click(screen.getByRole("button", { name: "Open preferences" }));

    expect(screen.getByRole("heading", { name: "Choose an appearance" })).toBeTruthy();
    expect(screen.getByText("Dark selected")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Light: Bright interface" }));

    expect(setPreference).toHaveBeenCalledWith("light");
  });
});
