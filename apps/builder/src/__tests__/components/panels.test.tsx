import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeftPanel } from "../../components/LeftPanel";
import { RightPanel } from "../../components/RightPanel";
import { PanelShell } from "../../components/PanelShell";

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

  it("renders left and right panel placeholders", () => {
    render(
      <div>
        <LeftPanel />
        <RightPanel />
      </div>
    );
    expect(
      screen.getByText("Component library will appear here.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select an element to inspect its properties.")
    ).toBeInTheDocument();
  });
});
