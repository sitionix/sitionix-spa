import { beforeEach, describe, expect, it } from "vitest";
import { AccessTokenStore } from "../../accessToken/accessTokenStore";

describe("AccessTokenStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("Given token and ttl When set Then returns token and non-expired state", () => {
    // Given
    const store = new AccessTokenStore();

    // When
    store.set("access-token", 120);

    // Then
    expect(store.get()).toBe("access-token");
    expect(store.isExpired()).toBe(false);
  });

  it("Given expired token When checking expiry Then reports expired", () => {
    // Given
    const store = new AccessTokenStore();
    store.set("access-token", 0);

    // When / Then
    expect(store.isExpired()).toBe(true);
  });

  it("Given token in session mode When creating new store Then hydrates from sessionStorage", () => {
    // Given
    const firstStore = new AccessTokenStore("SESSION_STORAGE");
    firstStore.set("persisted-token", 300);

    // When
    const secondStore = new AccessTokenStore("SESSION_STORAGE");

    // Then
    expect(secondStore.get()).toBe("persisted-token");
    expect(secondStore.isExpired()).toBe(false);
  });
});
