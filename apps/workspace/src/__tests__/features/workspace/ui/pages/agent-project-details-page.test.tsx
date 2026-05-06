import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentProjectDetailsPage } from "../../../../../features/workspace/modules/automation/pages/AgentProjectDetailsPage";
import {
  deleteAgentProject,
  getAgentProject,
  getErrorHttpStatus,
  patchAgentProject,
} from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  deleteAgentProject: vi.fn(),
  getAgentProject: vi.fn(),
  getErrorHttpStatus: vi.fn(),
  patchAgentProject: vi.fn(),
}));

const getAgentProjectMock = vi.mocked(getAgentProject);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);
const patchAgentProjectMock = vi.mocked(patchAgentProject);
const deleteAgentProjectMock = vi.mocked(deleteAgentProject);

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

function renderPageWithPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
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
    patchAgentProjectMock.mockReset();
    deleteAgentProjectMock.mockReset();
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

  it("renders archived project status badge", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Archived Project",
      description: "Archived description",
      status: "ARCHIVED",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("ARCHIVED")).toBeInTheDocument();
  });

  it("renders deleted project status badge", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Deleted Project",
      description: "Deleted description",
      status: "DELETED",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("DELETED")).toBeInTheDocument();
  });

  it("renders not found state when projectId is blank", async () => {
    renderPageWithPath("/automation/projects/%20");

    expect(await screen.findByText("Project not found")).toBeInTheDocument();
    expect(getAgentProjectMock).not.toHaveBeenCalled();
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

  it("patches project name inline", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Updated Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:05:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project name" })[0]);
    const input = screen.getByDisplayValue("Marketing Automation");
    await user.clear(input);
    await user.type(input, "  Updated Marketing Automation  ");
    await user.keyboard("{Enter}");

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { name: "Updated Marketing Automation" });
    expect(await screen.findByText("Updated Marketing Automation")).toBeInTheDocument();
  });

  it("does not patch unchanged project name", async () => {
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
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project name" })[0]);
    await user.keyboard("{Enter}");

    expect(patchAgentProjectMock).not.toHaveBeenCalled();
  });

  it("patches project description inline", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Updated description",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:05:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project description" })[0]);
    const textarea = screen.getByDisplayValue("Campaign automations");
    await user.clear(textarea);
    await user.type(textarea, "  Updated description  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { description: "Updated description" });
    expect(await screen.findByText("Updated description")).toBeInTheDocument();
  });

  it("shows error when patch project name fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockRejectedValue(new Error("Unable to save changes"));

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project name" })[0]);
    const input = screen.getByDisplayValue("Marketing Automation");
    await user.clear(input);
    await user.type(input, "Updated Marketing Automation");
    await user.keyboard("{Enter}");

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { name: "Updated Marketing Automation" });
    expect(await screen.findByText("Unable to save changes")).toBeInTheDocument();
  });

  it("renders archive disabled and deletes project after confirmation", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    deleteAgentProjectMock.mockResolvedValue();

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    const archiveButton = screen.getByRole("button", { name: "Archive" });
    expect(archiveButton).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(screen.getByText("Delete project?")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1]);

    expect(deleteAgentProjectMock).toHaveBeenCalledWith("project-1");
    expect(await screen.findByText("Automation projects page")).toBeInTheDocument();
  });
});
