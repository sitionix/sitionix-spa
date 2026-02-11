import { describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { renderWithProvider } from "../../test/render";
import { useBuilderStore } from "../../application/builderStore";

type Store = ReturnType<typeof useBuilderStore>;

const StoreProbe = ({
  onRender,
}: {
  onRender: (store: Store) => void;
}) => {
  const store = useBuilderStore();
  onRender(store);
  return null;
};

const createPage = (getStore: () => Store | null, name: string) => {
  act(() => {
    getStore()?.actions.openCreatePageModal();
  });
  act(() => {
    getStore()?.actions.updateCreatePageName(name);
  });
  act(() => {
    getStore()?.actions.submitCreatePage();
  });
};

describe("section actions", () => {
  it("adds a section and selects it", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    createPage(getStore, "Home");

    act(() => {
      getStore()?.actions.addSection(800);
    });

    const pageId = getStore()?.state.site.activePageId ?? null;
    expect(pageId).not.toBeNull();
    if (!pageId) return;

    const document = getStore()?.state.site.documents[pageId];
    const root = document?.nodes?.[document.rootId];
    expect(root?.type).toBe("Page");
    expect(root?.children?.length).toBe(1);
    const sectionId = root?.children?.[0];
    expect(getStore()?.state.editor.selectedNodeId).toBe(sectionId);
  });

  it("resizes section height and commits", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    createPage(getStore, "Home");

    act(() => {
      getStore()?.actions.addSection(800);
    });

    const pageId = getStore()?.state.site.activePageId ?? null;
    if (!pageId) return;
    const document = getStore()?.state.site.documents[pageId];
    const root = document?.nodes?.[document.rootId];
    const sectionId = root?.children?.[0];
    if (!sectionId) return;

    act(() => {
      getStore()?.actions.startSectionResize(sectionId, 200, 0, 1);
    });
    act(() => {
      getStore()?.actions.updateSectionResize(40);
    });
    act(() => {
      getStore()?.actions.endSectionResize();
    });

    const updated = getStore()?.state.site.documents[pageId];
    const section = updated?.nodes?.[sectionId];
    if (section?.type === "Section") {
      expect(section.section.height).toEqual({ mode: "manual", heightPx: 240 });
    }
  });

  it("respects min constraint when resizing", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    createPage(getStore, "Home");

    act(() => {
      getStore()?.actions.addSection(800);
    });

    const pageId = getStore()?.state.site.activePageId ?? null;
    if (!pageId) return;
    const document = getStore()?.state.site.documents[pageId];
    const root = document?.nodes?.[document.rootId];
    const sectionId = root?.children?.[0];
    if (!sectionId) return;

    act(() => {
      getStore()?.actions.selectNode(sectionId);
    });
    act(() => {
      getStore()?.actions.updateSectionMin("200");
    });
    act(() => {
      getStore()?.actions.commitSectionConstraints("min");
    });

    act(() => {
      getStore()?.actions.startSectionResize(sectionId, 240, 0, 1);
    });
    act(() => {
      getStore()?.actions.updateSectionResize(-200);
    });
    act(() => {
      getStore()?.actions.endSectionResize();
    });

    const updated = getStore()?.state.site.documents[pageId];
    const section = updated?.nodes?.[sectionId];
    if (section?.type === "Section") {
      expect(section.section.height).toEqual({
        mode: "manual",
        heightPx: 200,
        minPx: 200,
      });
    }
  });

  it("does not overwrite doc on invalid manual draft", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    createPage(getStore, "Home");

    act(() => {
      getStore()?.actions.addSection(800);
    });

    const pageId = getStore()?.state.site.activePageId ?? null;
    if (!pageId) return;
    const document = getStore()?.state.site.documents[pageId];
    const root = document?.nodes?.[document.rootId];
    const sectionId = root?.children?.[0];
    if (!sectionId) return;

    act(() => {
      getStore()?.actions.selectNode(sectionId);
    });
    act(() => {
      getStore()?.actions.updateSectionMode("manual");
    });
    act(() => {
      getStore()?.actions.updateSectionHeight("");
      getStore()?.actions.commitSectionHeight();
    });

    const updated = getStore()?.state.site.documents[pageId];
    const section = updated?.nodes?.[sectionId];
    if (section?.type === "Section") {
      expect(section.section.height.mode).toBe("auto");
    }
  });
});
