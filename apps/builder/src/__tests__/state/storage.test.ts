import { describe, expect, it, vi } from "vitest";
import { createEmptySiteState } from "../../application/siteState";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  STORAGE_KEY,
} from "../../application/storage";
import { createInitialDocument } from "../../domain/document";

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

  it("hydrates site state from builder document draft", () => {
    const doc = createInitialDocument("page-doc");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    const loaded = loadDraft();
    expect(loaded?.pageOrder).toHaveLength(1);
    const pageId = loaded?.pageOrder[0] ?? null;
    expect(pageId).not.toBeNull();
    if (pageId && loaded) {
      expect(loaded.documents[pageId].rootId).toBe(doc.rootId);
    }
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
