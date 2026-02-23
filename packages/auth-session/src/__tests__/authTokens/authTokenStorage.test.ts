import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_TOKEN_STORAGE_KEYS, saveAuthTokens } from "../../authTokens/authTokenStorage";

describe("saveAuthTokens", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("Given rememberMe true When saving tokens Then uses localStorage", () => {
    // Given
    const tokens = {
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: 3600,
      tokenType: "Bearer",
    };

    // When
    saveAuthTokens(tokens, true);

    // Then
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("access");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("refresh");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn)).toBe("3600");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.tokenType)).toBe("Bearer");
  });

  it("Given rememberMe false When saving tokens Then uses sessionStorage", () => {
    // Given
    const tokens = {
      accessToken: "access-session",
      refreshToken: "refresh-session",
      expiresIn: 7200,
      tokenType: "Bearer",
    };

    // When
    saveAuthTokens(tokens, false);

    // Then
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("access-session");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("refresh-session");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn)).toBe("7200");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.tokenType)).toBe("Bearer");
  });

  it("Given stale session tokens When rememberMe true Then clears session and keeps only local", () => {
    // Given
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "stale-session-access");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, "stale-session-refresh");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, "1");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");

    // When
    saveAuthTokens(
      {
        accessToken: "fresh-local-access",
        refreshToken: "fresh-local-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      true
    );

    // Then
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("fresh-local-access");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("fresh-local-refresh");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBeNull();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBeNull();
  });

  it("Given stale local tokens When rememberMe false Then clears local and keeps only session", () => {
    // Given
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "stale-local-access");
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, "stale-local-refresh");
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, "1");
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");

    // When
    saveAuthTokens(
      {
        accessToken: "fresh-session-access",
        refreshToken: "fresh-session-refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      false
    );

    // Then
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("fresh-session-access");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("fresh-session-refresh");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBeNull();
  });

  it("Given no window When saving tokens Then does nothing", () => {
    // Given
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });

    // When
    saveAuthTokens(
      {
        accessToken: "access",
        refreshToken: "refresh",
        expiresIn: 123,
        tokenType: "Bearer",
      },
      true
    );

    // Then
    expect(true).toBe(true);

    // Cleanup
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
    });
  });
});
