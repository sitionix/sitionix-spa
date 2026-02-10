import { describe, expect, it } from "vitest";
import { renderWithProvider } from "../../test/render";
import { Canvas } from "../../ui/components/Canvas";
import { useBuilderStore } from "../../application/builderStore";
import { act, screen } from "@testing-library/react";

const StoreProbe = ({ onRender }: { onRender: (store: ReturnType<typeof useBuilderStore>) => void }) => {
  const store = useBuilderStore();
  onRender(store);
  return null;
};

describe("Canvas", () => {
  it("renders empty site placeholder", () => {
    renderWithProvider(<Canvas />);
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
  });

  it("adjusts width based on breakpoint", async () => {
    let store: ReturnType<typeof useBuilderStore> | null = null;
    const { container, unmount } = renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (store = s)} />
        <Canvas />
      </>
    );

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
      store?.actions.setActiveBreakpoint("tablet");
    });
    expect(container.querySelector('.w-\\[768px\\]')).toBeTruthy();
    unmount();

    let mobileStore: ReturnType<typeof useBuilderStore> | null = null;
    const { container: mobileContainer } = renderWithProvider(
      <>
        <StoreProbe onRender={(s) => (mobileStore = s)} />
        <Canvas />
      </>
    );
    act(() => {
      mobileStore?.actions.openCreatePageModal();
    });
    act(() => {
      mobileStore?.actions.updateCreatePageName("Home");
    });
    act(() => {
      mobileStore?.actions.submitCreatePage();
    });
    act(() => {
      mobileStore?.actions.setActiveBreakpoint("mobile");
    });
    expect(mobileContainer.querySelector('.w-\\[375px\\]')).toBeTruthy();
  });
});
