import { describe, expect, it } from "vitest";
import { AuthInput, SocialAuthPanel, SocialAuthButton } from "../../../auth/social-auth/index";

describe("social-auth index", () => {
  it("Given exports When importing Then exposes social auth components", () => {
    // Given / When
    const items = [AuthInput, SocialAuthPanel, SocialAuthButton];

    // Then
    items.forEach((item) => {
      expect(typeof item).toBe("function");
    });
  });
});
