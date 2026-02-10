import { describe, expect, it, vi } from "vitest";
import { navigateHost } from "../../utils/navigateHost";

describe("navigateHost", () => {
  it("uses history.pushState when available", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    navigateHost("/workspace/sites");

    expect(pushSpy).toHaveBeenCalledWith({}, "", "/workspace/sites");
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("falls back to location.assign when pushState is missing", () => {
    const originalPush = window.history.pushState;
    const originalLocation = window.location;
    const assignSpy = vi.fn();

    Object.defineProperty(window, "location", {
      value: { assign: assignSpy },
      writable: true,
    });

    // @ts-expect-error - simulate missing pushState
    window.history.pushState = undefined;
    navigateHost("/workspace/sites");

    expect(assignSpy).toHaveBeenCalledWith("/workspace/sites");

    window.history.pushState = originalPush;
    Object.defineProperty(window, "location", {
      value: originalLocation,
    });
  });

  it("no-ops when window is missing", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - simulate missing window
    delete (globalThis as unknown as { window?: Window }).window;

    expect(() => navigateHost("/workspace/sites")).not.toThrow();

    globalThis.window = originalWindow;
  });
});
