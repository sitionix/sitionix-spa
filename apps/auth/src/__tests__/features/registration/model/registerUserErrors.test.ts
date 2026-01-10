import { describe, expect, it } from "vitest";
import { normalizeRegisterError } from "../../../../features/registration/model/registerUserErrors";

describe("normalizeRegisterError", () => {
  it("Given null error When normalizing Then returns default error", () => {
    // Given
    const error = null;

    // When
    const result = normalizeRegisterError(error);

    // Then
    expect(result.details).toBe("Unexpected error");
  });

  it("Given existing error When normalizing Then returns same error", () => {
    // Given
    const error = { code: 400, title: "Bad", details: "Invalid" };

    // When
    const result = normalizeRegisterError(error);

    // Then
    expect(result).toEqual(error);
  });
});
