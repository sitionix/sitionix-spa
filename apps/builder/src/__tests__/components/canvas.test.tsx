import { describe, expect, it } from "vitest";
import { renderWithProvider } from "../../test/render";
import { Canvas } from "../../components/Canvas";
import { useBuilderStore } from "../../state/builderStore";
import { act, screen } from "@testing-library/react";
import { useEffect } from "react";

const BreakpointSetter = ({ value }: { value: "desktop" | "tablet" | "mobile" }) => {
  const { actions } = useBuilderStore();
  useEffect(() => {
    actions.setActiveBreakpoint(value);
  }, [actions, value]);
  return null;
};

describe("Canvas", () => {
  it("renders empty page placeholder", () => {
    renderWithProvider(<Canvas />);
    expect(screen.getByText("Empty page")).toBeInTheDocument();
  });

  it("adjusts width based on breakpoint", async () => {
    const { container, unmount } = renderWithProvider(
      <>
        <BreakpointSetter value="tablet" />
        <Canvas />
      </>
    );

    await act(async () => {});
    expect(container.querySelector('.w-\\[768px\\]')).toBeTruthy();
    unmount();

    const { container: mobileContainer } = renderWithProvider(
      <>
        <BreakpointSetter value="mobile" />
        <Canvas />
      </>
    );
    await act(async () => {});
    expect(mobileContainer.querySelector('.w-\\[375px\\]')).toBeTruthy();
  });
});
