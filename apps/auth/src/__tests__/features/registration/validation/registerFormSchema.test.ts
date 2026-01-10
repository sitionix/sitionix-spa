import { describe, expect, it } from "vitest";
import { registerFormSchema } from "../../../../features/registration/validation/registerFormSchema";

describe("registerFormSchema", () => {
  it("Given valid input When parsing Then succeeds", () => {
    // Given
    const values = {
      email: "valid@example.com",
      name: "User",
      password: "Strong1!",
      passwordConfirm: "Strong1!",
      rememberMe: true,
    };

    // When
    const result = registerFormSchema.safeParse(values);

    // Then
    expect(result.success).toBe(true);
  });

  it("Given weak password When parsing Then fails with password error", () => {
    // Given
    const values = {
      email: "valid@example.com",
      name: "User",
      password: "weak",
      passwordConfirm: "weak",
      rememberMe: false,
    };

    // When
    const result = registerFormSchema.safeParse(values);

    // Then
    expect(result.success).toBe(false);
  });

  it("Given mismatched passwords When parsing Then fails with refine error", () => {
    // Given
    const values = {
      email: "valid@example.com",
      name: "User",
      password: "Strong1!",
      passwordConfirm: "Different1!",
      rememberMe: false,
    };

    // When
    const result = registerFormSchema.safeParse(values);

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "passwordConfirm"
      );
      expect(issue?.message).toBe("Паролі не співпадають");
    }
  });
});
