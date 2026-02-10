import { describe, expect, it, vi } from "vitest";

const renderSpy = vi.fn();
const createRootSpy = vi.fn(() => ({
  render: renderSpy,
}));

vi.mock("react-dom/client", () => ({
  createRoot: createRootSpy,
}));

describe("main entry", () => {
  it("throws if root container is missing", async () => {
    document.body.innerHTML = "";
    await expect(import("../main")).rejects.toThrow(
      "Root container (#root) not found"
    );
  });

  it("renders app when root container exists", async () => {
    vi.resetModules();
    createRootSpy.mockClear();
    renderSpy.mockClear();
    document.body.innerHTML = '<div id="root"></div>';

    await import("../main");

    expect(createRootSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
