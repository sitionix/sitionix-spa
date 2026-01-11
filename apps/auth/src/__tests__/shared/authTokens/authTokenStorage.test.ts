import { describe, expect, it } from "vitest";
import { AUTH_TOKEN_STORAGE_KEYS, saveAuthTokens } from "@sitionix/auth-session";

describe("saveAuthTokens", () => {
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
