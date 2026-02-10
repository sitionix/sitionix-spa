import { describe, expect, it } from "vitest";
import { createInitialDocument, isBuilderDocument } from "../../domain/document";

describe("document", () => {
  it("creates a minimal document with a page root", () => {
    const doc = createInitialDocument();
    expect(doc.pageId).toBe("local");
    expect(doc.version).toBe(1);
    expect(doc.rootId).toBe("page-1");
    expect(doc.nodes[doc.rootId]).toEqual({
      id: "page-1",
      type: "Page",
      children: [],
    });
  });

  it("respects custom page id", () => {
    const doc = createInitialDocument("site-42");
    expect(doc.pageId).toBe("site-42");
  });

  it("detects builder documents", () => {
    const doc = createInitialDocument();
    expect(isBuilderDocument(doc)).toBe(true);
    expect(isBuilderDocument(null)).toBe(false);
    expect(isBuilderDocument({})).toBe(false);
  });
});
