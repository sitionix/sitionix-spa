import { describe, expect, it } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProvider } from "../../test/render";
import { LeftPanel } from "../../ui/components/LeftPanel";
import { useBuilderStore } from "../../application/builderStore";

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

describe("LeftPanel", () => {
  it("renders pages list and supports inline rename", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <LeftPanel />
      </>
    );

    createPage(getStore, "Home");
    createPage(getStore, "About");

    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("/about")).toBeInTheDocument();

    const aboutButtons = screen.getAllByRole("button", { name: /About/ });
    const aboutItem =
      aboutButtons.find((node) => node.getAttribute("aria-pressed") !== null) ??
      aboutButtons[0];
    fireEvent.click(aboutItem);

    const nameNodes = screen.getAllByText("Home");
    fireEvent.doubleClick(nameNodes[0]);

    const input = screen.getByDisplayValue("Home");
    fireEvent.change(input, { target: { value: "Homepage" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Homepage")).toBeInTheDocument();
  });

  it("shows components dependency hint only when empty", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <LeftPanel />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Components" }));
    expect(
      screen.getByText("Create a page first to use components.")
    ).toBeInTheDocument();

    createPage(getStore, "Home");

    fireEvent.click(screen.getByRole("button", { name: "Components" }));
    expect(
      screen.queryByText("Create a page first to use components.")
    ).not.toBeInTheDocument();
  });

  it("shows rename validation and blocks switching during delete", () => {
    let store: Store | null = null;
    const getStore = () => store;
    renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <LeftPanel />
      </>
    );

    createPage(getStore, "Home");
    createPage(getStore, "About");

    const aboutButtons = screen.getAllByRole("button", { name: /About/ });
    const aboutItem =
      aboutButtons.find((node) => node.getAttribute("aria-pressed") !== null) ??
      aboutButtons[0];
    fireEvent.keyDown(aboutItem, { key: "Enter" });

    const aboutName = screen.getAllByText("About")[0];
    fireEvent.doubleClick(aboutName);

    const renameInput = screen.getByDisplayValue("About");
    fireEvent.change(renameInput, { target: { value: "" } });
    fireEvent.blur(renameInput);
    expect(screen.getByText("Name is required.")).toBeInTheDocument();

    fireEvent.keyDown(renameInput, { key: "Escape" });

    const deleteButton = screen.getByLabelText("Delete About");
    fireEvent.click(deleteButton);

    const homeButtons = screen.getAllByRole("button", { name: /Home/ });
    const homeItem =
      homeButtons.find((node) => node.getAttribute("aria-pressed") !== null) ??
      homeButtons[0];
    fireEvent.click(homeItem);

    const aboutId = getStore()?.state.site.pageOrder[1];
    expect(getStore()?.state.site.activePageId).toBe(aboutId);
  });
});
