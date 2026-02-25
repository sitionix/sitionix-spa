import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { navigateInBrowser } from "../../navigation/navigateInBrowser";

describe("navigateInBrowser", () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "jsdom-test-runner",
    });
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: originalUserAgent,
    });
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("Given jsdom environment When navigating Then uses history fallback", () => {
    // When
    navigateInBrowser("/workspace");

    // Then
    expect(window.location.pathname).toBe("/workspace");
  });

  it("Given no browser window When navigating Then exits without error", () => {
    // Given
    vi.stubGlobal("window", undefined);

    try {
      // When / Then
      expect(() => navigateInBrowser("/auth/authorisation")).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
