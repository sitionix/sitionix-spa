import { describe, expect, it } from "vitest";
import { AuthButton, AuthSidePanel, AuthInput } from "../../auth/index";

describe("auth index", () => {
  it("Given exports When importing Then exposes auth components", () => {
    // Given / When
    const items = [AuthButton, AuthSidePanel, AuthInput];

    // Then
    items.forEach((item) => {
      expect(typeof item).toBe("function");
    });
  });
});
