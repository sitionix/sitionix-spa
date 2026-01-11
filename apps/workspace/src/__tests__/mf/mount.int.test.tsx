import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { mount } from "../../mf/mount";

describe("mount", () => {
  it("Given container When mounting twice Then reuses root and can unmount", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const first = mount(container, { basename: "/" });
    await waitFor(() => {
      expect(container.textContent).toContain("Dashboard");
    });

    const second = mount(container, { basename: "/" });
    await waitFor(() => {
      expect(container.textContent).toContain("Dashboard");
    });

    second.unmount();
    expect(container.textContent).toBe("");
    first.unmount();
  });
});
