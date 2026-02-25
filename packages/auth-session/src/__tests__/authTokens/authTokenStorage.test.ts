import { beforeEach, describe, expect, it } from "vitest";
import { authSessionManager } from "../../AuthSessionManager";
import { saveAuthTokens } from "../../authTokens/authTokenStorage";

describe("saveAuthTokens", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authSessionManager.clear();
  });

  it("Given access token payload When saving tokens Then stores token in auth session manager", () => {
    // Given
    const tokens = {
      accessToken: "access-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    };

    // When
    saveAuthTokens(tokens);

    // Then
    expect(authSessionManager.getAccessToken()).toBe("access-token");
  });

  it("Given access token payload When saving tokens Then does not persist refresh token in web storage", () => {
    // Given
    const tokens = {
      accessToken: "access-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    };

    // When
    saveAuthTokens(tokens);

    // Then
    expect(localStorage.getItem("sitionix.auth.refreshToken")).toBeNull();
    expect(sessionStorage.getItem("sitionix.auth.refreshToken")).toBeNull();
  });
});
