import { describe, expect, it } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProvider } from "../../test/render";
import { useBuilderStore } from "../../application/builderStore";
import { CreatePageModal } from "../../ui/components/CreatePageModal";
import { DeletePageModal } from "../../ui/components/DeletePageModal";

type Store = ReturnType<typeof useBuilderStore>;

const StoreProbe = ({ onRender }: { onRender: (store: Store) => void }) => {
  const store = useBuilderStore();
  onRender(store);
  return null;
};

const openModal = (getStore: () => Store | null) => {
  act(() => {
    getStore()?.actions.openCreatePageModal();
  });
};

const createPage = (getStore: () => Store | null, name: string) => {
  openModal(getStore);
  act(() => {
    getStore()?.actions.updateCreatePageName(name);
  });
  act(() => {
    getStore()?.actions.submitCreatePage();
  });
};

describe("Page modals", () => {
  it("derives slug when home is unchecked", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <CreatePageModal />
      </>
    );

    openModal(getStore);

    fireEvent.click(screen.getByRole("checkbox", { name: /set as home page/i }));
    const nameInput = screen.getByPlaceholderText("About");
    fireEvent.change(nameInput, { target: { value: "About Us" } });

    expect(screen.getByPlaceholderText("/about")).toHaveValue("/about-us");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("confirms delete page", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <CreatePageModal />
        <DeletePageModal />
      </>
    );

    createPage(getStore, "Home");
    const pageId = getStore()?.state.site.pageOrder[0] ?? null;
    expect(pageId).not.toBeNull();

    act(() => {
      if (pageId) {
        getStore()?.actions.requestDeletePage(pageId);
      }
    });

    expect(screen.getAllByText("Delete page")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Delete page" }));

    expect(getStore()?.state.site.pageOrder).toHaveLength(0);
  });
});
