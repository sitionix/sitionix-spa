import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectFlowPage } from "../../../../../features/workspace/modules/automation/pages/ProjectFlowPage";
import { getProjectFlow, getProjectFlowPalette } from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  getProjectFlow: vi.fn(),
  getProjectFlowPalette: vi.fn(),
}));

const getProjectFlowMock = vi.mocked(getProjectFlow);
const getProjectFlowPaletteMock = vi.mocked(getProjectFlowPalette);

function renderPage(path = "/automation/projects/project-1/flow") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/automation/projects/:projectId/flow" element={<ProjectFlowPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProjectFlowPage", () => {
  beforeEach(() => {
    getProjectFlowMock.mockReset();
    getProjectFlowPaletteMock.mockReset();
  });

  it("renders empty canvas shell when flow response has no nodes and no edges", async () => {
    getProjectFlowMock.mockResolvedValue({
      flowId: null,
      nodes: [],
      edges: [],
    });
    getProjectFlowPaletteMock.mockResolvedValue({ sources: [] });

    renderPage();

    expect(await screen.findByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("0 nodes · 0 edges")).toBeInTheDocument();
    expect(screen.getByText("Empty flow. No nodes or edges available yet.")).toBeInTheDocument();
  });

  it("keeps canvas visible when flow succeeds and palette request fails", async () => {
    getProjectFlowMock.mockResolvedValue({
      flowId: "flow-1",
      nodes: [
        {
          id: "node-1",
          nodeType: "AGENT",
          referenceId: "agent-1",
          position: { x: 100, y: 220 },
        },
      ],
      edges: [],
    });
    getProjectFlowPaletteMock.mockRejectedValue(new Error("Palette unavailable"));

    renderPage();

    expect(await screen.findByText("1 nodes · 0 edges")).toBeInTheDocument();
    expect(screen.getByText("Palette unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load project flow")).not.toBeInTheDocument();
  });

  it("renders flow-level error and hides canvas when flow request fails", async () => {
    getProjectFlowMock.mockRejectedValue(new Error("Flow failed"));
    getProjectFlowPaletteMock.mockResolvedValue({ sources: [] });

    renderPage();

    expect(await screen.findByText("Unable to load project flow")).toBeInTheDocument();
    expect(screen.getByText("Flow failed")).toBeInTheDocument();
    expect(screen.queryByText("Canvas")).not.toBeInTheDocument();
  });

  it("renders all palette items when source type repeats", async () => {
    getProjectFlowMock.mockResolvedValue({
      flowId: "flow-1",
      nodes: [],
      edges: [],
    });
    getProjectFlowPaletteMock.mockResolvedValue({
      sources: [
        { sourceType: "AGENT", sourceId: "agent-1", sourceName: "Planner" },
        { sourceType: "AGENT", sourceId: "agent-2", sourceName: "Planner" },
      ],
    });

    renderPage();

    expect(await screen.findByText("Palette")).toBeInTheDocument();
    expect(screen.getAllByText("AGENT")).toHaveLength(2);
    expect(screen.getAllByText("Planner")).toHaveLength(2);
  });
});
