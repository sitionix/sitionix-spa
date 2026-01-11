import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { mount } from "../../mf/mount";

describe("mount", () => {
  it("Given container When mounting twice Then reuses root and can unmount", async () => {
    // Given
    const container = document.createElement("div");
    document.body.appendChild(container);

    // When
    const first = mount(container, { basename: "/" });
    await waitFor(() => {
      expect(container.textContent).toContain("Реєстраці");
    });
    const second = mount(container, { basename: "/" });

    // Then
    await waitFor(() => {
      expect(container.textContent).toContain("Реєстраці");
    });

    // Cleanup
    second.unmount();
    expect(container.textContent).toBe("");
    first.unmount();
  });
});
