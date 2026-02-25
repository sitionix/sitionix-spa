import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirectStandaloneToShell } from "../../navigation/redirectStandaloneToShell";

describe("redirectStandaloneToShell", () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Chrome/120.0",
    });
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: originalUserAgent,
    });
    vi.restoreAllMocks();
  });

  it("Given Jsdom User Agent When redirecting Then returns false", () => {
    // Given
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "jsdom-test-runner",
    });
    const onRedirect = vi.fn();

    // When
    const result = redirectStandaloneToShell({
      shellOrigin: "https://shell.localhost",
      standalonePrefix: "/auth",
      shellPrefix: "/auth",
      defaultPath: "/authorisation",
      onRedirect,
    });

    // Then
    expect(result).toBe(false);
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("Given same Origin When redirecting Then returns false", () => {
    // Given
    const onRedirect = vi.fn();

    // When
    const result = redirectStandaloneToShell({
      shellOrigin: window.location.origin,
      standalonePrefix: "/auth",
      shellPrefix: "/auth",
      defaultPath: "/authorisation",
      onRedirect,
    });

    // Then
    expect(result).toBe(false);
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("Given root standalone path When redirecting Then uses default path", () => {
    // Given
    window.history.pushState({}, "", "/auth?foo=bar#hash");
    const onRedirect = vi.fn();

    // When
    const result = redirectStandaloneToShell({
      shellOrigin: "https://shell.localhost",
      standalonePrefix: "/auth",
      shellPrefix: "/auth",
      defaultPath: "/authorisation",
      onRedirect,
    });

    // Then
    expect(result).toBe(true);
    expect(onRedirect).toHaveBeenCalledWith(
      "https://shell.localhost/auth/authorisation?foo=bar#hash"
    );
  });

  it("Given nested standalone path When redirecting Then keeps nested segment", () => {
    // Given
    window.history.pushState({}, "", "/workspace/settings?tab=a#top");
    const onRedirect = vi.fn();

    // When
    const result = redirectStandaloneToShell({
      shellOrigin: "https://shell.localhost",
      standalonePrefix: "/workspace",
      shellPrefix: "/workspace",
      defaultPath: "",
      onRedirect,
    });

    // Then
    expect(result).toBe(true);
    expect(onRedirect).toHaveBeenCalledWith(
      "https://shell.localhost/workspace/settings?tab=a#top"
    );
  });

  it("Given non-prefixed path When redirecting Then keeps original path", () => {
    // Given
    window.history.pushState({}, "", "/custom/path?x=1");
    const onRedirect = vi.fn();

    // When
    const result = redirectStandaloneToShell({
      shellOrigin: "https://shell.localhost",
      standalonePrefix: "/builder",
      shellPrefix: "/builder",
      defaultPath: "",
      onRedirect,
    });

    // Then
    expect(result).toBe(true);
    expect(onRedirect).toHaveBeenCalledWith(
      "https://shell.localhost/builder/custom/path?x=1"
    );
  });
});
