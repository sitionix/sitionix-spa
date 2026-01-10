import { describe, expect, it } from "vitest";
import { AuthButton } from "../index";

describe("ui index", () => {
  it("Given exports When importing Then exposes AuthButton", () => {
    // Given / When
    const value = AuthButton;

    // Then
    expect(typeof value).toBe("function");
  });
});
