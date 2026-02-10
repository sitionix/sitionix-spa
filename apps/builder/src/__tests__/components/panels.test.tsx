import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeftPanel } from "../../ui/components/LeftPanel";
import { RightPanel } from "../../ui/components/RightPanel";
import { PanelShell } from "../../ui/components/PanelShell";
import { renderWithProvider } from "../../test/render";

describe("Panel components", () => {
  it("renders PanelShell with title and content", () => {
    render(
      <PanelShell title="Test title">
        <div>Inner</div>
      </PanelShell>
    );
    expect(screen.getByText("Test title")).toBeInTheDocument();
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });

  it("renders left and right panel content", () => {
    renderWithProvider(
      <div>
        <LeftPanel />
        <RightPanel />
      </div>
    );
    expect(screen.getByRole("button", { name: "Pages" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ New page" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No page selected")
    ).toBeInTheDocument();
  });
});
