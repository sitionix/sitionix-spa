import { describe, expect, it, vi } from "vitest";
import { createEmptySiteState } from "../../application/siteState";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  STORAGE_KEY,
} from "../../application/storage";

describe("storage", () => {
  it("saves and loads a draft site", () => {
    const site = createEmptySiteState();
    saveDraft(site);
    const loaded = loadDraft();
    expect(loaded).toEqual(site);
  });

  it("clears a stored draft", () => {
    const site = createEmptySiteState();
    saveDraft(site);
    clearDraft();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadDraft()).toBeNull();
  });

  it("returns null for invalid json", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadDraft()).toBeNull();
  });

  it("handles storage failures gracefully", () => {
    const setItem = vi
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("fail");
      });
    expect(() => saveDraft(createEmptySiteState())).not.toThrow();
    setItem.mockRestore();
  });
});
