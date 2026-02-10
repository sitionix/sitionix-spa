import { describe, expect, it, vi } from "vitest";
import { renderWithProvider } from "../../test/render";
import { TopBar } from "../../ui/components/TopBar";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "../../application/builderStore";

vi.mock("../../application/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/storage")>();
  return {
    ...actual,
    saveDraft: vi.fn(),
  };
});

vi.mock("../../utils/navigateHost", () => ({
  navigateHost: vi.fn(),
}));

import { saveDraft } from "../../application/storage";
import { navigateHost } from "../../utils/navigateHost";

const BreakpointProbe = () => {
  const {
    state: { editor },
  } = useBuilderStore();
  return <div data-testid="bp">{editor.activeBreakpoint}</div>;
};

describe("TopBar", () => {
  it("renders title and toggles preview state", async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <TopBar siteId="local" />
        <BreakpointProbe />
      </>
    );

    expect(screen.getByText("New site")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /preview/i }));
    expect(
      screen.getByText("Preview mode: editing disabled")
    ).toBeInTheDocument();
  });

  it("updates breakpoint on button click", async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <TopBar siteId="local" />
        <BreakpointProbe />
      </>
    );

    await user.click(screen.getByRole("button", { name: /tablet/i }));
    expect(screen.getByTestId("bp")).toHaveTextContent("tablet");

    await user.click(screen.getByRole("button", { name: /desktop/i }));
    expect(screen.getByTestId("bp")).toHaveTextContent("desktop");

    await user.click(screen.getByRole("button", { name: /mobile/i }));
    expect(screen.getByTestId("bp")).toHaveTextContent("mobile");
  });

  it("saves draft and shows saved hint", async () => {
    vi.useFakeTimers();
    renderWithProvider(<TopBar siteId="local" />);
    saveDraft.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Saved")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("navigates back to sites on exit", async () => {
    renderWithProvider(<TopBar siteId="demo" />);
    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(navigateHost).toHaveBeenCalledWith("/workspace/sites");
    expect(screen.getByText("Site: demo")).toBeInTheDocument();
  });
});
