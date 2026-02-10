import { describe, expect, it, vi } from "vitest";
import type { MountResult } from "../../mf/mount";

const renderSpy = vi.fn();
const unmountSpy = vi.fn();
const createRootSpy = vi.fn(() => ({
  render: renderSpy,
  unmount: unmountSpy,
}));

vi.mock("react-dom/client", () => ({
  createRoot: createRootSpy,
}));

describe("mf mount", () => {
  it("mounts once per container and unmounts", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    window.history.pushState({}, "", "/builder/demo");

    const { mount } = await import("../../mf/mount");

    const first = mount(container, { basename: "/builder" }) as MountResult;
    const second = mount(container, { basename: "/builder" }) as MountResult;

    expect(createRootSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(2);

    first.unmount();
    expect(unmountSpy).toHaveBeenCalledTimes(1);

    second.unmount();
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });
});
