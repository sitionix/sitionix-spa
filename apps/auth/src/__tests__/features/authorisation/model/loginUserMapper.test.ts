import { describe, expect, it } from "vitest";
import { mapFormToLoginRequest } from "../../../../features/authorisation/model/loginUserMapper";

describe("mapFormToLoginRequest", () => {
  it("Given form values and context When mapping Then returns request payload", () => {
    // Given
    const values = {
      email: "user@example.com",
      password: "Password1!",
    };
    const ctx = {
      role: "SUPER_ADMIN" as const,
      siteId: "site-1",
    };

    // When
    const result = mapFormToLoginRequest(values, ctx);

    // Then
    expect(result).toEqual({
      email: "user@example.com",
      password: "Password1!",
      siteId: "site-1",
    });
  });

  it("Given no siteId When mapping Then omits siteId", () => {
    // Given
    const values = {
      email: "user@example.com",
      password: "Password1!",
    };
    const ctx = {
      role: "SUPER_ADMIN" as const,
    };

    // When
    const result = mapFormToLoginRequest(values, ctx);

    // Then
    expect(result).toEqual({
      email: "user@example.com",
      password: "Password1!",
    });
  });
});
