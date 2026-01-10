import { describe, expect, it } from "vitest";
import { mapFormToLoginRequest } from "../../../../features/authorisation/model/loginUserMapper";

describe("mapFormToLoginRequest", () => {
  it("Given form values and context When mapping Then returns request payload", () => {
    // Given
    const values = {
      email: "user@example.com",
      password: "Password1!",
      rememberMe: false,
    };
    const ctx = {
      role: "SUPER_ADMIN" as const,
      siteId: "site-1",
      sessionSourceId: "ssid-1",
      userAgent: "Agent",
    };

    // When
    const result = mapFormToLoginRequest(values, ctx);

    // Then
    expect(result).toEqual({
      email: "user@example.com",
      password: "Password1!",
      siteId: "site-1",
      sessionSourceId: "ssid-1",
      userAgent: "Agent",
    });
  });

  it("Given no siteId When mapping Then omits siteId", () => {
    // Given
    const values = {
      email: "user@example.com",
      password: "Password1!",
      rememberMe: false,
    };
    const ctx = {
      role: "SUPER_ADMIN" as const,
      sessionSourceId: "ssid-1",
      userAgent: "Agent",
    };

    // When
    const result = mapFormToLoginRequest(values, ctx);

    // Then
    expect(result).toEqual({
      email: "user@example.com",
      password: "Password1!",
      sessionSourceId: "ssid-1",
      userAgent: "Agent",
    });
  });
});
