import { describe, expect, it } from "vitest";
import { getUserAgent } from "../../session/userAgent";

describe("getUserAgent", () => {
  it("Given navigator with userAgent When called Then returns userAgent string", () => {
    // Given
    Object.defineProperty(window.navigator, "userAgent", {
      value: "TestAgent/1.0",
      configurable: true,
    });

    // When
    const value = getUserAgent();

    // Then
    expect(value).toBe("TestAgent/1.0");
  });

  it("Given no navigator When called Then returns empty string", () => {
    // Given
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
    });

    // When
    const value = getUserAgent();

    // Then
    expect(value).toBe("");

    // Cleanup
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });
});
