import { describe, expect, it, vi } from "vitest";
import { createInitialDocument } from "../../state/document";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  STORAGE_KEY,
} from "../../state/storage";

describe("storage", () => {
  it("saves and loads a draft document", () => {
    const doc = createInitialDocument("site-1");
    saveDraft(doc);
    const loaded = loadDraft();
    expect(loaded).toEqual(doc);
  });

  it("clears a stored draft", () => {
    const doc = createInitialDocument("site-2");
    saveDraft(doc);
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
    expect(() => saveDraft(createInitialDocument())).not.toThrow();
    setItem.mockRestore();
  });
});
