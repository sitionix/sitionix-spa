import { describe, expect, it } from "vitest";
import { publicEnv } from "../../../shared/env/publicEnv";

describe("publicEnv", () => {
  it("Given VITE_API_BASE_URL When importing Then exposes apiBaseUrl", () => {
    // Given
    const expected = "http://localhost";

    // When
    const value = publicEnv.apiBaseUrl;

    // Then
    expect(value).toBe(expected);
  });
});
