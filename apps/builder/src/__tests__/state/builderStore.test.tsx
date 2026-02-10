import { describe, expect, it } from "vitest";
import {
  builderReducer,
  createInitialState,
  type BuilderState,
  useBuilderStore,
} from "../../application/builderStore";
import { createEmptySiteState } from "../../application/siteState";
import { STORAGE_KEY } from "../../application/storage";
import { render } from "@testing-library/react";

describe("builderStore", () => {
  it("hydrates local draft when present", () => {
    const draft = createEmptySiteState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    const state = createInitialState("local");
    expect(state.site.activePageId).toBeNull();
  });

  it("creates empty site when no draft", () => {
    const state = createInitialState("site-99");
    expect(state.site.pageOrder).toHaveLength(0);
    expect(state.site.activePageId).toBeNull();
  });

  it("updates breakpoint and mode via reducer", () => {
    const base: BuilderState = createInitialState("local");
    const nextBreakpoint = builderReducer(base, {
      type: "editor/setBreakpoint",
      breakpoint: "tablet",
    });
    expect(nextBreakpoint.editor.activeBreakpoint).toBe("tablet");

    const nextMode = builderReducer(base, { type: "editor/toggleMode" });
    expect(nextMode.editor.mode).toBe("preview");
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
