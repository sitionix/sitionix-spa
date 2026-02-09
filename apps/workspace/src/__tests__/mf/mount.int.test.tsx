import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { act } from "react";
import { mount } from "../../mf/mount";

describe("mount", () => {
  it("Given container When mounting twice Then reuses root and can unmount", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let first: ReturnType<typeof mount>;
    await act(() => {
      first = mount(container, { basename: "/" });
    });
    await waitFor(() => {
      expect(container.textContent).toContain("Вебсайти");
    }, { timeout: 3000 });

    let second: ReturnType<typeof mount>;
    await act(() => {
      second = mount(container, { basename: "/" });
    });
    await waitFor(() => {
      expect(container.textContent).toContain("Вебсайти");
    }, { timeout: 3000 });

    second.unmount();
    expect(container.textContent).toBe("");
    first.unmount();
  });
});
