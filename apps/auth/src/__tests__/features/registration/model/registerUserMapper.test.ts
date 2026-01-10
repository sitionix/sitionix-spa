import { describe, expect, it } from "vitest";
import { mapFormToRegisterRequest } from "../../../../features/registration/model/registerUserMapper";

describe("mapFormToRegisterRequest", () => {
  it("Given form values and context When mapping Then returns request payload", () => {
    // Given
    const values = {
      email: "test@example.com",
      name: "Test",
      password: "Password1!",
      passwordConfirm: "Password1!",
      rememberMe: true,
    };
    const ctx = { role: "SUPER_ADMIN" as const, siteId: "site-1" };

    // When
    const result = mapFormToRegisterRequest(values, ctx);

    // Then
    expect(result).toEqual({
      email: "test@example.com",
      password: "Password1!",
      siteId: "site-1",
      role: "SUPER_ADMIN",
    });
  });
});
