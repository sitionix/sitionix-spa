import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrCreateSessionSourceId } from "../../session/sessionSourceId";

describe("getOrCreateSessionSourceId", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("Given stored value When called Then returns stored value", () => {
    // Given
    localStorage.setItem("sitionix.sessionSourceId", "stored-id");

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
    expect(localStorage.getItem("sitionix.sessionSourceId")).toBe("uuid-123");
  });

  it("Given no crypto UUID When called Then uses fallback and stores", () => {
    // Given
    vi.stubGlobal("crypto", {});

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBeTruthy();
    expect(localStorage.getItem("sitionix.sessionSourceId")).toBe(value);
  });

  it("Given legacy key exists When called Then migrates and returns legacy value", () => {
    // Given
    localStorage.setItem("sitionix.auth.sessionSourceId", "legacy-id");

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBe("legacy-id");
    expect(localStorage.getItem("sitionix.sessionSourceId")).toBe("legacy-id");
    expect(localStorage.getItem("sitionix.auth.sessionSourceId")).toBeNull();
  });

  it("Given crypto has getRandomValues only When called Then builds UUID from random bytes", () => {
    // Given
    const getRandomValues = vi.fn().mockImplementation((bytes: Uint8Array) => {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = index + 1;
      }
      return bytes;
    });
    vi.stubGlobal("crypto", { getRandomValues });

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(getRandomValues).toHaveBeenCalledTimes(1);
    expect(value).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem("sitionix.sessionSourceId")).toBe(value);
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

  it("Given no window object When called Then still returns value", () => {
    // Given
    vi.stubGlobal("window", undefined);

    // When
    const value = getOrCreateSessionSourceId();

    // Then
    expect(value).toBeTruthy();
  });

  it("Given same origin reload When called again Then returns stable value", () => {
    // Given
    const firstValue = getOrCreateSessionSourceId();

    // When
    const secondValue = getOrCreateSessionSourceId();

    // Then
    expect(firstValue).toBe(secondValue);
  });
});
