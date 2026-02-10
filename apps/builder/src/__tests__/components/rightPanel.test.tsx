import { describe, expect, it } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProvider } from "../../test/render";
import { useBuilderStore } from "../../application/builderStore";
import { RightPanel } from "../../ui/components/RightPanel";

type Store = ReturnType<typeof useBuilderStore>;

const StoreProbe = ({ onRender }: { onRender: (store: Store) => void }) => {
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

describe("RightPanel", () => {
  it("renders page inspector and commits updates", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <RightPanel />
      </>
    );

    createPage(getStore, "Home");
    createPage(getStore, "About");

    const aboutId = getStore()?.state.site.pageOrder[1];
    act(() => {
      if (aboutId) {
        getStore()?.actions.setActivePage(aboutId);
      }
    });

    const nameInput = screen.getByDisplayValue("About");
    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.blur(nameInput);
    expect(getStore()?.state.site.pages[aboutId!].name).toBe("About");

    fireEvent.change(nameInput, { target: { value: "About Us" } });
    fireEvent.blur(nameInput);
    expect(getStore()?.state.site.pages[aboutId!].name).toBe("About Us");

    const slugInput = screen.getByDisplayValue("/about");
    fireEvent.change(slugInput, { target: { value: "bad slug" } });
    fireEvent.blur(slugInput);
    expect(getStore()?.state.site.pages[aboutId!].slug).toBe("/about");

    fireEvent.change(slugInput, { target: { value: "/about-us" } });
    fireEvent.blur(slugInput);
    expect(getStore()?.state.site.pages[aboutId!].slug).toBe("/about-us");

    const homeToggle = screen.getByRole("checkbox");
    fireEvent.click(homeToggle);

    expect(getStore()?.state.site.pages[aboutId!].isHome).toBe(true);
    expect(getStore()?.state.site.pages[aboutId!].slug).toBe("/");
  });
});
