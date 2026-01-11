import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

describe("main", () => {
  it("Given no root element When importing Then throws error", async () => {
    // Given
    document.body.innerHTML = "";
    vi.resetModules();

    // When / Then
    await expect(import("../main")).rejects.toThrow(
      "Root container (#root) not found"
    );
  });

  it("Given root element When importing Then renders app", async () => {
    // Given
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();

    // When
    await import("../main");

    // Then
    await waitFor(() => {
      expect(document.body.textContent).toContain("Реєстраці");
    });
  });
});
