import { describe, expect, it } from "vitest";
import { createInitialDocument } from "../../state/document";
import {
  builderReducer,
  createInitialState,
  type BuilderState,
  useBuilderStore,
} from "../../state/builderStore";
import { STORAGE_KEY } from "../../state/storage";
import { render } from "@testing-library/react";

describe("builderStore", () => {
  it("hydrates local draft when present", () => {
    const draft = createInitialDocument("draft-site");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    const state = createInitialState("local");
    expect(state.document.pageId).toBe("draft-site");
  });

  it("creates new document when no draft", () => {
    const state = createInitialState("site-99");
    expect(state.document.pageId).toBe("site-99");
  });

  it("updates breakpoint, mode, and document via reducer", () => {
    const base: BuilderState = createInitialState("local");
    const nextBreakpoint = builderReducer(base, {
      type: "setBreakpoint",
      breakpoint: "tablet",
    });
    expect(nextBreakpoint.editor.activeBreakpoint).toBe("tablet");

    const nextMode = builderReducer(base, { type: "toggleMode" });
    expect(nextMode.editor.mode).toBe("preview");

    const customDoc = createInitialDocument("custom");
    const nextDoc = builderReducer(base, {
      type: "loadDocument",
      document: customDoc,
    });
    expect(nextDoc.document.pageId).toBe("custom");
  });

  it("throws when hook is used outside provider", () => {
    const Broken = () => {
      useBuilderStore();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(
      "useBuilderStore must be used within BuilderStoreProvider"
    );
  });
});
