import { describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { renderWithProvider } from "../../test/render";
import { useBuilderStore } from "../../application/builderStore";

const StoreProbe = ({
  onRender,
}: {
  onRender: (store: ReturnType<typeof useBuilderStore>) => void;
}) => {
  const store = useBuilderStore();
  onRender(store);
  return null;
};

describe("builder actions", () => {
  it("deletes active page and selects next deterministically", () => {
    let store: ReturnType<typeof useBuilderStore> | null = null;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    act(() => {
      store?.actions.openCreatePageModal();
    });
    act(() => {
      store?.actions.updateCreatePageName("Home");
    });
    act(() => {
      store?.actions.submitCreatePage();
    });

    act(() => {
      store?.actions.openCreatePageModal();
    });
    act(() => {
      store?.actions.updateCreatePageName("About");
    });
    act(() => {
      store?.actions.submitCreatePage();
    });

    act(() => {
      store?.actions.openCreatePageModal();
    });
    act(() => {
      store?.actions.updateCreatePageName("Contact");
    });
    act(() => {
      store?.actions.submitCreatePage();
    });

    const pageOrder = store?.state.site.pageOrder ?? [];
    const aboutId = pageOrder[1];

    act(() => {
      store?.actions.setActivePage(aboutId);
    });

    act(() => {
      store?.actions.requestDeletePage(aboutId);
    });
    act(() => {
      store?.actions.confirmDeletePage();
    });

    const nextOrder = store?.state.site.pageOrder ?? [];
    const expectedActive = nextOrder[1] ?? nextOrder[0] ?? null;
    expect(store?.state.site.activePageId).toBe(expectedActive);
  });

  it("deletes last page to reach empty site", () => {
    let store: ReturnType<typeof useBuilderStore> | null = null;
    renderWithProvider(<StoreProbe onRender={(s) => (store = s)} />);

    act(() => {
      store?.actions.openCreatePageModal();
    });
    act(() => {
      store?.actions.updateCreatePageName("Home");
    });
    act(() => {
      store?.actions.submitCreatePage();
    });

    const pageId = store?.state.site.pageOrder[0] ?? null;
    expect(pageId).not.toBeNull();

    act(() => {
      if (pageId) {
        store?.actions.requestDeletePage(pageId);
      }
    });
    act(() => {
      if (pageId) {
        store?.actions.confirmDeletePage();
      }
    });

    expect(store?.state.site.pageOrder).toHaveLength(0);
    expect(store?.state.site.activePageId).toBeNull();
  });
});
