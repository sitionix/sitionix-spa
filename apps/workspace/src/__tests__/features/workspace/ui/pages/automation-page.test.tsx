import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { AutomationPage } from "../../../../../features/workspace/modules/automation/pages/AutomationPage";
import {
  activateAgent,
  createAgentProject,
  getAgentProjects,
  getAgents,
  restoreAgent,
} from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  activateAgent: vi.fn(),
  createAgentProject: vi.fn(),
  getAgentProjects: vi.fn(),
  getAgents: vi.fn(),
  restoreAgent: vi.fn(),
}));

vi.mock("../../../../../features/workspace/modules/automation/components/CreateAgentSheet", () => ({
  CreateAgentSheet: ({
    open,
    onClose,
    onCreated,
  }: {
    open: boolean;
    onClose: () => void;
    onCreated: (agent: {
      id: string;
      name: string;
      description: string;
      status: "DRAFT";
      createdAt: string;
      updatedAt: string;
    }) => void;
  }) => (
    open ? (
      <div>
        <button type="button" onClick={onClose}>
          Close mocked sheet
        </button>
        <button
          type="button"
          onClick={() =>
            onCreated({
              id: "agent-created",
              name: "Created Agent",
              description: "Created description",
              status: "DRAFT",
              createdAt: "2026-04-11T10:00:00.000Z",
              updatedAt: "2026-04-11T10:00:00.000Z",
            })
          }
        >
          Emit created
        </button>
      </div>
    ) : null
  ),
}));

const activateAgentMock = vi.mocked(activateAgent);
const createAgentProjectMock = vi.mocked(createAgentProject);
const getAgentProjectsMock = vi.mocked(getAgentProjects);
const getAgentsMock = vi.mocked(getAgents);
const restoreAgentMock = vi.mocked(restoreAgent);

function AgentDetailsRouteProbe() {
  const { agentId } = useParams<{ agentId: string }>();
  return <div>Agent details route: {agentId}</div>;
}

function AgentChatRouteProbe() {
  const { agentId } = useParams<{ agentId: string }>();
  return <div>Agent chat route: {agentId}</div>;
}

function ProjectDetailsRouteProbe() {
  const { projectId } = useParams<{ projectId: string }>();
  return <div>Project details route: {projectId}</div>;
}

function renderAutomationPage() {
  return render(
    <MemoryRouter initialEntries={["/automation"]}>
      <Routes>
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/automation/projects/:projectId" element={<ProjectDetailsRouteProbe />} />
        <Route path="/automation/agents/:agentId" element={<AgentDetailsRouteProbe />} />
        <Route path="/automation/agents/:agentId/chat" element={<AgentChatRouteProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AutomationPage", () => {
  beforeEach(() => {
    activateAgentMock.mockReset();
    createAgentProjectMock.mockReset();
    getAgentProjectsMock.mockReset();
    getAgentsMock.mockReset();
    restoreAgentMock.mockReset();
    getAgentProjectsMock.mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      hasNext: false,
    });
  });

  it("renders empty state when no agents are returned", async () => {
    getAgentsMock.mockResolvedValue([]);

    renderAutomationPage();

    expect(await screen.findByText("No agents yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create Agent" })).toHaveLength(2);
  });

  it("renders error block and retries loading", async () => {
    const firstError = new Error("Network unavailable");
    getAgentsMock
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce([
        {
          id: "agent-1",
          name: "Agent",
          description: "Description",
          status: "DRAFT",
          createdAt: "2026-04-11T10:00:00.000Z",
          updatedAt: "2026-04-11T10:00:00.000Z",
        },
      ]);

    renderAutomationPage();

    expect(await screen.findByText("Не вдалося завантажити Automation")).toBeInTheDocument();
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Agent")).toBeInTheDocument();
    expect(getAgentsMock).toHaveBeenCalledTimes(2);
  });

  it("opens create sheet and prepends created agent", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Existing Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    expect(await screen.findByText("Existing Agent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Agent" }));
    await user.click(screen.getByRole("button", { name: "Emit created" }));

    await waitFor(() => {
      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings[0]).toHaveTextContent("Created Agent");
    });
  });

  it("opens and closes create sheet", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Existing Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    expect(await screen.findByText("Existing Agent")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create Agent" }));
    expect(screen.getByRole("button", { name: "Close mocked sheet" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close mocked sheet" }));
    expect(screen.queryByRole("button", { name: "Close mocked sheet" })).not.toBeInTheDocument();
  });

  it("givenDraftAgent_whenCardClicked_thenNavigatesToAgentOverviewRoute", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-44",
        name: "Routing Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    const card = await screen.findByRole("button", { name: /Routing Agent/i });
    await user.click(card);

    expect(await screen.findByText("Agent details route: agent-44")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Emit created" })).not.toBeInTheDocument();
  });

  it("givenDraftAgent_whenCardEnterPressed_thenNavigatesToAgentOverviewRoute", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-44",
        name: "Routing Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    const card = await screen.findByRole("button", { name: /Routing Agent/i });
    card.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText("Agent details route: agent-44")).toBeInTheDocument();
  });

  it("givenArchivedAgent_whenCardClicked_thenNavigatesToAgentOverviewRoute", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-52",
        name: "Archived Routing Agent",
        description: "Description",
        status: "ARCHIVED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    const card = await screen.findByRole("button", { name: /Archived Routing Agent/i });
    await user.click(card);

    expect(await screen.findByText("Agent details route: agent-52")).toBeInTheDocument();
  });

  it("givenActiveAgent_whenCardClicked_thenNavigatesToAgentOverviewRoute", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-90",
        name: "Active Routing Agent",
        description: "Description",
        status: "ACTIVE",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    const card = await screen.findByRole("button", { name: /Active Routing Agent/i });
    await user.click(card);

    expect(await screen.findByText("Agent details route: agent-90")).toBeInTheDocument();
  });

  it("givenActiveAgent_whenChatCtaClicked_thenNavigatesToAgentChatRoute", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-90",
        name: "Active Routing Agent",
        description: "Description",
        status: "ACTIVE",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    renderAutomationPage();

    await screen.findByRole("button", { name: /Active Routing Agent/i });
    await user.click(screen.getByRole("button", { name: "Chat" }));

    expect(await screen.findByText("Agent chat route: agent-90")).toBeInTheDocument();
  });

  it("givenDraftAgent_whenActivateCtaClicked_thenActivatesAgentAndShowsChatCta", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-44",
        name: "Draft Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);
    activateAgentMock.mockResolvedValue({
      id: "agent-44",
      name: "Draft Agent",
      description: "Description",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
    });

    const user = userEvent.setup();
    renderAutomationPage();

    expect(await screen.findByRole("button", { name: "Activate" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activate" }));

    expect(activateAgentMock).toHaveBeenCalledWith("agent-44");
    expect(await screen.findByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
  });

  it("givenDraftAgent_whenActivateFails_thenShowsRecoverableError", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-44",
        name: "Draft Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);
    activateAgentMock
      .mockRejectedValueOnce(new Error("Activate failed"))
      .mockResolvedValueOnce({
        id: "agent-44",
        name: "Draft Agent",
        description: "Description",
        status: "ACTIVE",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-12T10:00:00.000Z",
      });

    const user = userEvent.setup();
    renderAutomationPage();

    const activateButton = await screen.findByRole("button", { name: "Activate" });
    await user.click(activateButton);

    expect(await screen.findByText("Activate failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));
    expect(activateAgentMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("button", { name: "Chat" })).toBeInTheDocument();
  });

  it("givenArchivedAgent_whenRestoreCtaClicked_thenRestoresAgentAndShowsActivateCta", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-52",
        name: "Archived Agent",
        description: "Description",
        status: "ARCHIVED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);
    restoreAgentMock.mockResolvedValue({
      id: "agent-52",
      name: "Archived Agent",
      description: "Description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
    });

    const user = userEvent.setup();
    renderAutomationPage();

    expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(restoreAgentMock).toHaveBeenCalledWith("agent-52");
    expect(await screen.findByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });

  it("renders lifecycle statuses in agent list cards", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-draft",
        name: "Draft Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
      {
        id: "agent-active",
        name: "Active Agent",
        description: "Description",
        status: "ACTIVE",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
      {
        id: "agent-archived",
        name: "Archived Agent",
        description: "Description",
        status: "ARCHIVED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    renderAutomationPage();

    expect(await screen.findByText("Draft Agent")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("ARCHIVED")).toBeInTheDocument();
  });
  it("shows projects empty state when projects tab selected", async () => {
    getAgentsMock.mockResolvedValue([]);

    const user = userEvent.setup();
    renderAutomationPage();

    await screen.findByText("No agents yet");
    await user.click(screen.getByRole("button", { name: "Projects" }));

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create Project" })).toHaveLength(2);
  });

  it("creates project and prepends it to projects list", async () => {
    getAgentsMock.mockResolvedValue([]);
    createAgentProjectMock.mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Campaign automations",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });

    const user = userEvent.setup();
    renderAutomationPage();

    await screen.findByText("No agents yet");
    await user.click(screen.getByRole("button", { name: "Projects" }));
    await user.click(screen.getAllByRole("button", { name: "Create Project" })[0]);

    await user.type(screen.getByLabelText("Name"), "  Marketing Automation  ");
    await user.type(screen.getByLabelText("Description"), "  Campaign automations  ");
    const createProjectSheet = screen.getByRole("complementary");
    await user.click(within(createProjectSheet).getByRole("button", { name: "Create Project" }));

    expect(await screen.findByText("Marketing Automation")).toBeInTheDocument();
    expect(screen.getByText("Campaign automations")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(createAgentProjectMock).toHaveBeenCalledWith({
      name: "Marketing Automation",
      description: "Campaign automations",
    });
  });

  it("shows fallback description for empty and whitespace project descriptions", async () => {
    getAgentsMock.mockResolvedValue([]);
    getAgentProjectsMock.mockResolvedValue({
      items: [
        {
          id: "project-1",
          name: "Empty Description",
          description: "",
          status: "ACTIVE",
          createdAt: "2026-05-05T12:00:00Z",
          updatedAt: "2026-05-05T12:00:00Z",
        },
        {
          id: "project-2",
          name: "Whitespace Description",
          description: "   ",
          status: "ACTIVE",
          createdAt: "2026-05-05T11:00:00Z",
          updatedAt: "2026-05-05T11:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      hasNext: false,
    });

    const user = userEvent.setup();
    renderAutomationPage();

    await screen.findByText("No agents yet");
    await user.click(screen.getByRole("button", { name: "Projects" }));

    expect(await screen.findAllByText("No description yet.")).toHaveLength(2);
  });

  it("givenProjectCard_whenClicked_thenNavigatesToProjectDetailsRoute", async () => {
    getAgentsMock.mockResolvedValue([]);
    getAgentProjectsMock.mockResolvedValue({
      items: [
        {
          id: "project-77",
          name: "Routing Project",
          description: "Description",
          status: "ACTIVE",
          createdAt: "2026-05-05T12:00:00Z",
          updatedAt: "2026-05-05T12:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      hasNext: false,
    });

    const user = userEvent.setup();
    renderAutomationPage();

    await screen.findByText("No agents yet");
    await user.click(screen.getByRole("button", { name: "Projects" }));

    const card = await screen.findByRole("button", { name: /Routing Project/i });
    await user.click(card);

    expect(await screen.findByText("Project details route: project-77")).toBeInTheDocument();
  });
});
