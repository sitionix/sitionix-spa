import { describe, expect, it, vi } from "vitest";
import { getOrCreateSessionSourceId } from "../../../shared/session/sessionSourceId";

describe("getOrCreateSessionSourceId", () => {
  it("Given stored value When called Then returns stored value", () => {
    // Given
    localStorage.setItem("sitionix.auth.sessionSourceId", "stored-id");

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBe("stored-id");
  });

  it("Given no stored value and crypto UUID When called Then stores and returns UUID", () => {
    // Given
    const randomUUID = vi.fn().mockReturnValue("uuid-123");
    vi.stubGlobal("crypto", { randomUUID });

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBe("uuid-123");
    expect(localStorage.getItem("sitionix.auth.sessionSourceId")).toBe("uuid-123");
  });

  it("Given no crypto UUID When called Then uses fallback and stores", () => {
    // Given
    vi.stubGlobal("crypto", {});

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toMatch(/^ssid_/);
    expect(localStorage.getItem("sitionix.auth.sessionSourceId")).toBe(value);
  });

  it("Given no localStorage When called Then returns generated value without throwing", () => {
    // Given
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      configurable: true,
    });

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBeTruthy();

    // Cleanup
    Object.defineProperty(globalThis, "localStorage", {
      value: originalStorage,
      configurable: true,
    });
  });
});
