import { describe, expect, it } from "vitest";
import {
  createEmptySiteState,
  createSiteStateFromDocument,
  isSiteState,
} from "../../application/siteState";
import { createInitialDocument } from "../../domain/document";
import { asPageId, asSlug } from "../../domain/pages";

describe("siteState", () => {
  it("creates empty site state", () => {
    const state = createEmptySiteState();
    expect(state.pageOrder).toHaveLength(0);
    expect(state.activePageId).toBeNull();
  });

  it("creates site state from document", () => {
    const doc = createInitialDocument("page-x");
    const state = createSiteStateFromDocument(doc, { name: "Home", now: 123 });
    const pageId = state.pageOrder[0];
    expect(state.activePageId).toBe(pageId);
    expect(state.pages[pageId].name).toBe("Home");
    expect(state.pages[pageId].createdAt).toBe(123);
    expect(state.documents[pageId].pageId).toBe(pageId);
  });

  it("validates site state shape", () => {
    const valid = createEmptySiteState();
    expect(isSiteState(valid)).toBe(true);

    const invalid = { ...valid, activePageId: "missing" };
    expect(isSiteState(invalid)).toBe(false);

    const invalidTypes = { ...valid, pageOrder: "nope" as never };
    expect(isSiteState(invalidTypes)).toBe(false);

    const invalidOrder = {
      ...valid,
      pageOrder: [asPageId("page-1")],
      pages: { [asPageId("page-1")]: { ...valid.pages } },
    } as unknown;
    expect(isSiteState(invalidOrder)).toBe(false);

    const invalidActive = {
      activePageId: null,
      pageOrder: [asPageId("page-1")],
      pages: {
        [asPageId("page-1")]: {
          name: "Home",
          slug: asSlug("/"),
          isHome: true,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      documents: {
        [asPageId("page-1")]: createInitialDocument("page-1"),
      },
    };
    expect(isSiteState(invalidActive)).toBe(false);
  });
});
