import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentProjectDetailsPage } from "../../../../../features/workspace/modules/automation/pages/AgentProjectDetailsPage";
import { getAgentProject, getErrorHttpStatus } from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  getAgentProject: vi.fn(),
  getErrorHttpStatus: vi.fn(),
}));

const getAgentProjectMock = vi.mocked(getAgentProject);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/automation/projects/project-1"]}>
      <Routes>
        <Route path="/automation/projects/:projectId" element={<AgentProjectDetailsPage />} />
        <Route path="/automation" element={<div>Automation projects page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AgentProjectDetailsPage", () => {
  beforeEach(() => {
    getAgentProjectMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("renders project details when loaded", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("Marketing Automation")).toBeInTheDocument();
    expect(screen.getByText("Campaign automations")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
  });

  it("renders fallback description when description is null", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: null,
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("No description yet.")).toBeInTheDocument();
  });

  it("renders not-found state on 404 response", async () => {
    getAgentProjectMock.mockRejectedValue(new Error("Not found"));
    getErrorHttpStatusMock.mockReturnValue(404);

    renderPage();

    expect(await screen.findByText("Project not found")).toBeInTheDocument();
    expect(screen.getByText("This project may have been deleted or you may not have access to it.")).toBeInTheDocument();
  });

  it("renders generic error with retry", async () => {
    getAgentProjectMock.mockRejectedValueOnce(new Error("Gateway failed"));
    getAgentProjectMock.mockResolvedValueOnce({
      id: "project-1",
      name: "Recovered Project",
      description: "Recovered",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Unable to load project details")).toBeInTheDocument();
    expect(screen.getByText("Gateway failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Recovered Project")).toBeInTheDocument();
  });

  it("navigates back to projects", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Marketing Automation")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to Projects" }));

    expect(await screen.findByText("Automation projects page")).toBeInTheDocument();
  });

  it("renders loading state", async () => {
    getAgentProjectMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(await screen.findByText("Loading project details...")).toBeInTheDocument();
  });
});
