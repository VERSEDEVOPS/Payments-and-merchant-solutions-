// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecurityPage } from "./SecurityPage";

describe("SecurityPage ownership upgrade", () => {
  it("tells operators to move vault ownership to a Safe", () => {
    render(<SecurityPage />);

    expect(
      screen.getByRole("heading", { name: /upgrade to a Safe/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/transfer ownership of the vault/i),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /create a Polygon Safe/i })
        .getAttribute("href"),
    ).toContain("app.safe.global");
  });
});
