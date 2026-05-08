import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentProjectDetailsPage } from "../../../../../features/workspace/modules/automation/pages/AgentProjectDetailsPage";
import {
  addAgentToProject,
  createProjectConversation,
  deleteAgentProject,
  getAgents,
  getAgentProject,
  getProjectConversations,
  getErrorHttpStatus,
  listAgentProjectAgents,
  patchAgentProject,
  removeAgentFromProject,
} from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  deleteAgentProject: vi.fn(),
  createProjectConversation: vi.fn(),
  getProjectConversations: vi.fn(),
  addAgentToProject: vi.fn(),
  getAgents: vi.fn(),
  getAgentProject: vi.fn(),
  getErrorHttpStatus: vi.fn(),
  listAgentProjectAgents: vi.fn(),
  patchAgentProject: vi.fn(),
  removeAgentFromProject: vi.fn(),
}));

const getAgentProjectMock = vi.mocked(getAgentProject);
const getProjectConversationsMock = vi.mocked(getProjectConversations);
const createProjectConversationMock = vi.mocked(createProjectConversation);
const listAgentProjectAgentsMock = vi.mocked(listAgentProjectAgents);
const getAgentsMock = vi.mocked(getAgents);
const addAgentToProjectMock = vi.mocked(addAgentToProject);
const removeAgentFromProjectMock = vi.mocked(removeAgentFromProject);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);
const patchAgentProjectMock = vi.mocked(patchAgentProject);
const deleteAgentProjectMock = vi.mocked(deleteAgentProject);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/automation/projects/project-1"]}>
      <Routes>
        <Route path="/automation/projects/:projectId" element={<AgentProjectDetailsPage />} />
        <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<div>Project conversation page</div>} />
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
        <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<div>Project conversation page</div>} />
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
    listAgentProjectAgentsMock.mockReset();
    getAgentsMock.mockReset();
    addAgentToProjectMock.mockReset();
    getProjectConversationsMock.mockReset();
    createProjectConversationMock.mockReset();
    removeAgentFromProjectMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
    listAgentProjectAgentsMock.mockResolvedValue([]);
    getProjectConversationsMock.mockResolvedValue({ items: [] });
  });

  it("renders project details when loaded", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Project level description",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("Marketing Automation")).toBeInTheDocument();
    expect(screen.getByText("Project level description")).toBeInTheDocument();
    expect(screen.getByText("Campaign automations")).toBeInTheDocument();
    expect(screen.getByText("Project context")).toBeInTheDocument();
    expect(screen.getByText("Describe what agents should know when working inside this project.")).toBeInTheDocument();
    expect(screen.getByText("Workspace view, project context, and lifecycle controls for this automation project.")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Chat" })).toBeInTheDocument();
    expect(await screen.findByText("No conversations yet.")).toBeInTheDocument();
    expect(await screen.findByText("No agents attached yet")).toBeInTheDocument();
  });

  it("opens new chat sheet, toggles selection, creates conversation and navigates", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Writer",
        description: "Writes copy",
        status: "ACTIVE",
        createdAt: "2026-05-05T12:00:00Z",
        updatedAt: "2026-05-05T12:00:00Z",
        attachedAt: "2026-05-06T12:00:00Z",
      },
    ]);
    createProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      title: "Chat with Writer",
      type: "DIRECT",
      status: "ACTIVE",
      participants: [{ type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" }],
      canSendMessages: false,
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
      lastMessageAt: null,
      messages: [],
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "New Chat" }));
    const writerButtons = await screen.findAllByRole("button", { name: /Writer/ });
    const writerCard = writerButtons.find((button) => button.hasAttribute("aria-pressed"));
    expect(writerCard).toBeDefined();
    expect(screen.getByRole("button", { name: "Create chat" })).toBeDisabled();
    await user.click(writerCard as HTMLElement);
    expect(screen.getByRole("button", { name: "Create chat" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Create chat" }));

    expect(createProjectConversationMock).toHaveBeenCalledWith("project-1", ["agent-1"]);
    expect(await screen.findByText("Project conversation page")).toBeInTheDocument();
  });

  it("navigates to created conversation when refresh conversations fails after successful create", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Writer",
        description: "Writes copy",
        status: "ACTIVE",
        createdAt: "2026-05-05T12:00:00Z",
        updatedAt: "2026-05-05T12:00:00Z",
        attachedAt: "2026-05-06T12:00:00Z",
      },
    ]);
    getProjectConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockRejectedValueOnce(new Error("refresh failed"));
    createProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      title: "Chat with Writer",
      type: "DIRECT",
      status: "ACTIVE",
      participants: [{ type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" }],
      canSendMessages: false,
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
      lastMessageAt: null,
      messages: [],
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "New Chat" }));
    const writerButtons = await screen.findAllByRole("button", { name: /Writer/ });
    const writerCard = writerButtons.find((button) => button.hasAttribute("aria-pressed"));
    expect(writerCard).toBeDefined();
    await user.click(writerCard as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Create chat" }));

    expect(createProjectConversationMock).toHaveBeenCalledWith("project-1", ["agent-1"]);
    expect(await screen.findByText("Project conversation page")).toBeInTheDocument();
  });

  it("renders attached project agents", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Marketing Writer",
        description: null,
        status: "ACTIVE",
        createdAt: "2026-05-05T12:00:00Z",
        updatedAt: "2026-05-05T12:00:00Z",
        attachedAt: "2026-05-06T12:00:00Z",
      },
    ]);

    renderPage();

    expect(await screen.findByText("Marketing Writer")).toBeInTheDocument();
    expect(screen.getAllByText("No description yet.").length).toBeGreaterThan(0);
  });

  it("opens add agents sheet and filters already attached agents", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock
      .mockResolvedValueOnce([{ id: "agent-1", name: "A1", description: "d1", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z", attachedAt: "2026-05-06T12:00:00Z" }])
      .mockResolvedValueOnce([{ id: "agent-1", name: "A1", description: "d1", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z", attachedAt: "2026-05-06T12:00:00Z" }]);
    getAgentsMock.mockResolvedValue([
      { id: "agent-1", name: "A1", description: "d1", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
      { id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
    ]);

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "Add Agents" }));

    expect(await screen.findByRole("heading", { name: "Add Agents" })).toBeInTheDocument();
    expect(screen.getAllByText("A1")).toHaveLength(1);
    expect(screen.getByText("A2")).toBeInTheDocument();
  });

  it("selects/unselects and submits selected agents", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([]);
    getAgentsMock.mockResolvedValue([
      { id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
    ]);
    addAgentToProjectMock.mockResolvedValue({
      id: "agent-2",
      name: "A2",
      description: "d2",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
      attachedAt: "2026-05-06T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "Add Agents" }));
    const card = await screen.findByRole("button", { name: /A2/ });

    expect(screen.getByRole("button", { name: "Add selected agents" })).toBeDisabled();
    await user.click(card);
    expect(card.className).toContain("agent-card--selected");
    expect(screen.getByRole("button", { name: "Add selected agents" })).toBeEnabled();
    await user.click(card);
    expect(card.className).not.toContain("agent-card--selected");
  });

  it("keeps failed agents available when add selected agents partially fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "agent-1",
          name: "A1",
          description: "d1",
          status: "ACTIVE",
          createdAt: "2026-05-05T12:00:00Z",
          updatedAt: "2026-05-05T12:00:00Z",
          attachedAt: "2026-05-06T12:00:00Z",
        },
      ]);
    getAgentsMock
      .mockResolvedValueOnce([
        { id: "agent-1", name: "A1", description: "d1", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
        { id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
      ])
      .mockResolvedValueOnce([
        { id: "agent-1", name: "A1", description: "d1", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
        { id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z" },
      ]);
    addAgentToProjectMock.mockImplementation(async (_, { agentId }) => {
      if (agentId === "agent-2") {
        throw new Error("Failed to add agent");
      }
      return {
        id: "agent-1",
        name: "A1",
        description: "d1",
        status: "ACTIVE",
        createdAt: "2026-05-05T12:00:00Z",
        updatedAt: "2026-05-05T12:00:00Z",
        attachedAt: "2026-05-06T12:00:00Z",
      };
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "Add Agents" }));

    const agent1Card = await screen.findByRole("button", { name: /A1/ });
    const agent2Card = await screen.findByRole("button", { name: /A2/ });
    await user.click(agent1Card);
    await user.click(agent2Card);
    await user.click(screen.getByRole("button", { name: "Add selected agents" }));

    expect(await screen.findByText("Failed to add agent")).toBeInTheDocument();
    const addAgentsHeading = screen.getByRole("heading", { name: "Add Agents" });
    const addAgentsSheet = addAgentsHeading.closest("aside");
    expect(addAgentsSheet).not.toBeNull();
    const sheet = within(addAgentsSheet as HTMLElement);
    expect(sheet.queryByRole("button", { name: /A1/ })).not.toBeInTheDocument();
    expect(sheet.getByRole("button", { name: /A2/ })).toBeInTheDocument();
  });

  it("removes attached project agent after confirmation", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock
      .mockResolvedValueOnce([{ id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z", attachedAt: "2026-05-06T12:00:00Z" }])
      .mockResolvedValueOnce([]);
    removeAgentFromProjectMock.mockResolvedValue();

    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("A2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove A2" }));
    expect(screen.getByText("Remove agent from project?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeAgentFromProjectMock).toHaveBeenCalledWith("project-1", "agent-2");
  });

  it("shows error and retry action when attached agents loading fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock
      .mockRejectedValueOnce(new Error("Unable to load attached agents"))
      .mockResolvedValueOnce([]);

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Unable to load attached agents")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No agents attached yet")).toBeInTheDocument();
  });

  it("shows no available agents state in add agents sheet", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([]);
    getAgentsMock.mockResolvedValue([]);

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");
    await user.click(screen.getByRole("button", { name: "Add Agents" }));

    expect(await screen.findByText("No available agents")).toBeInTheDocument();
  });

  it("shows remove error and keeps agent visible when remove fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    listAgentProjectAgentsMock.mockResolvedValue([
      { id: "agent-2", name: "A2", description: "d2", status: "ACTIVE", createdAt: "2026-05-05T12:00:00Z", updatedAt: "2026-05-05T12:00:00Z", attachedAt: "2026-05-06T12:00:00Z" },
    ]);
    removeAgentFromProjectMock.mockRejectedValue(new Error("Unable to remove project agent"));

    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("A2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove A2" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Unable to remove project agent")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
  });

  it("renders fallback context when context is null", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: null,
      context: null,
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("No context yet.")).toBeInTheDocument();
  });

  it("does not render project context inside overview metadata", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "No context in this card",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText("No context in this card")).toBeInTheDocument();
    expect(screen.queryByText("PROJECT CONTEXT")).not.toBeInTheDocument();
  });

  it("renders project context with preserved line breaks", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Line one\nLine two",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByText(/Line one\s+Line two/)).toBeInTheDocument();
  });

  it("renders archived project status badge", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Archived Project",
      context: "Archived description",
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
      context: "Deleted description",
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
      context: "Recovered",
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
      context: "Campaign automations",
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
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Updated Marketing Automation",
      context: "Campaign automations",
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

  it("patches project description inline", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign project",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Updated campaign description",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:05:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project description" })[0]);
    const textarea = screen.getByDisplayValue("Campaign project");
    await user.clear(textarea);
    await user.type(textarea, "  Updated campaign description  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { description: "Updated campaign description" });
    expect(await screen.findByText("Updated campaign description")).toBeInTheDocument();
  });

  it("does not patch unchanged project name", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
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

  it("does not patch unchanged project description", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign project",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getAllByRole("button", { name: "Edit project description" })[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).not.toHaveBeenCalled();
  });

  it("patches project context inline", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Updated description",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:05:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getByRole("button", { name: "Edit project context" }));
    const textarea = screen.getByDisplayValue("Campaign automations");
    await user.clear(textarea);
    await user.type(textarea, "  Updated description  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { context: "Updated description" });
    expect(await screen.findByText("Updated description")).toBeInTheDocument();
  });

  it("does not patch unchanged project context", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getByRole("button", { name: "Edit project context" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).not.toHaveBeenCalled();
  });

  it("shows error when patch project context fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    patchAgentProjectMock.mockRejectedValue(new Error("Unable to save context"));

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getByRole("button", { name: "Edit project context" }));
    const textarea = screen.getByDisplayValue("Campaign automations");
    await user.type(textarea, " updated");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentProjectMock).toHaveBeenCalledWith("project-1", { context: "Campaign automations updated" });
    expect(await screen.findByText("Unable to save context")).toBeInTheDocument();
  });

  it("enforces context textarea max length", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Marketing Automation");

    await user.click(screen.getByRole("button", { name: "Edit project context" }));
    const textarea = screen.getByDisplayValue("Campaign automations");
    expect(textarea).toHaveAttribute("maxLength", "5000");
  });

  it("shows error when patch project name fails", async () => {
    getAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      context: "Campaign automations",
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
      context: "Campaign automations",
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
