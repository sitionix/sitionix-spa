import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { formatDateTime } from "../../../../../features/workspace/model/formatters";
import { AgentOverviewPage } from "../../../../../features/workspace/modules/automation/pages/AgentOverviewPage";
import {
  acceptAgentRule,
  activateAgent,
  archiveAgent,
  createAgentRule,
  deleteAgent,
  deleteAgentRule,
  getAgentById,
  getAgentRules,
  getErrorHttpStatus,
  patchAgent,
  patchAgentRule,
  rejectAgentRule,
  restoreAgent,
} from "../../../../../features/workspace/modules/automation/api";

vi.mock("../../../../../features/workspace/modules/automation/api", () => ({
  acceptAgentRule: vi.fn(),
  activateAgent: vi.fn(),
  archiveAgent: vi.fn(),
  createAgentRule: vi.fn(),
  deleteAgent: vi.fn(),
  deleteAgentRule: vi.fn(),
  getAgentById: vi.fn(),
  getAgentRules: vi.fn(),
  getErrorHttpStatus: vi.fn(),
  patchAgent: vi.fn(),
  patchAgentRule: vi.fn(),
  rejectAgentRule: vi.fn(),
  restoreAgent: vi.fn(),
}));

const acceptAgentRuleMock = vi.mocked(acceptAgentRule);
const activateAgentMock = vi.mocked(activateAgent);
const archiveAgentMock = vi.mocked(archiveAgent);
const createAgentRuleMock = vi.mocked(createAgentRule);
const deleteAgentMock = vi.mocked(deleteAgent);
const deleteAgentRuleMock = vi.mocked(deleteAgentRule);
const getAgentByIdMock = vi.mocked(getAgentById);
const getAgentRulesMock = vi.mocked(getAgentRules);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);
const patchAgentMock = vi.mocked(patchAgent);
const patchAgentRuleMock = vi.mocked(patchAgentRule);
const rejectAgentRuleMock = vi.mocked(rejectAgentRule);
const restoreAgentMock = vi.mocked(restoreAgent);

const agent = {
  id: "agent-1",
  name: "Overview Agent",
  description: "Agent overview description",
  instruction: undefined,
  status: "DRAFT" as const,
  createdAt: "2026-04-11T10:00:00.000Z",
  updatedAt: "2026-04-12T15:30:00.000Z",
};

function renderOverview(initialPath = "/automation/agents/agent-1") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/automation" element={<div>Automation Home</div>} />
        <Route path="/automation/agents/:agentId" element={<AgentOverviewPage />} />
        <Route path="/automation/agents/:agentId/chat" element={<div>Agent Chat Page</div>} />
        <Route path="/automation/agents" element={<AgentOverviewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AgentOverviewPage", () => {
  beforeEach(() => {
    acceptAgentRuleMock.mockReset();
    activateAgentMock.mockReset();
    archiveAgentMock.mockReset();
    createAgentRuleMock.mockReset();
    deleteAgentMock.mockReset();
    deleteAgentRuleMock.mockReset();
    getAgentByIdMock.mockReset();
    getAgentRulesMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    patchAgentMock.mockReset();
    patchAgentRuleMock.mockReset();
    rejectAgentRuleMock.mockReset();
    restoreAgentMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
    getAgentRulesMock.mockResolvedValue([]);
  });

  it("renders loading and then successful overview with agent definition section", async () => {
    getAgentByIdMock.mockResolvedValue(agent);

    renderOverview();

    expect(screen.getByText("Loading agent overview...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    expect(screen.getByText("Overview Agent")).toBeInTheDocument();
    expect(screen.getByText("Agent overview description")).toBeInTheDocument();
    expect(screen.getByText("ID: agent-1")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(agent.createdAt))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(agent.updatedAt))).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Agent Definition" })).toBeInTheDocument();
    expect(screen.getByText("No instruction defined yet.")).toBeInTheDocument();
    expect(screen.getByText("Add instruction to define how this agent should behave.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rules" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suggested Rules" })).toBeInTheDocument();
    expect(screen.getByText("No suggested rules")).toBeInTheDocument();
    expect(screen.queryByText(/guidance support/i)).not.toBeInTheDocument();
  });

  it("renders empty description state when description is absent", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      description: null,
    });

    renderOverview();

    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });

  it("renders saved instruction when agent has definition text", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      instruction: "Focus on explicit boundaries.",
    });

    renderOverview();

    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();
    expect(screen.getByText("Focus on explicit boundaries.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit agent instruction" })).toBeInTheDocument();
  });

  it("renders not-found state for 404 and supports back navigation", async () => {
    const notFoundError = new Error("Not found");
    getAgentByIdMock.mockRejectedValue(notFoundError);
    getErrorHttpStatusMock.mockReturnValue(404);

    const user = userEvent.setup();
    renderOverview();

    expect(await screen.findByRole("heading", { name: "Agent not found" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to Automation" }));
    expect(await screen.findByText("Automation Home")).toBeInTheDocument();
  });

  it("renders generic error state and retries loading", async () => {
    const user = userEvent.setup();
    getAgentByIdMock.mockRejectedValueOnce(new Error("Boom")).mockResolvedValueOnce(agent);
    getErrorHttpStatusMock.mockReturnValue(null);

    renderOverview();

    expect(await screen.findByRole("heading", { name: "Unable to load Agent Overview" })).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();
    expect(getAgentByIdMock).toHaveBeenCalledTimes(2);
  });

  it("renders not-found and skips api call when agentId route param is missing", async () => {
    renderOverview("/automation/agents");

    expect(await screen.findByRole("heading", { name: "Agent not found" })).toBeInTheDocument();
    expect(getAgentByIdMock).not.toHaveBeenCalled();
  });

  it("saves edited name on Enter and sends only name in patch payload", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    patchAgentMock.mockResolvedValue({
      ...agent,
      name: "Updated Name",
      updatedAt: "2026-04-13T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent name" })[0]);
    const nameInput = screen.getByDisplayValue("Overview Agent");
    await user.clear(nameInput);
    await user.type(nameInput, "  Updated Name  {Enter}");

    expect(patchAgentMock).toHaveBeenCalledWith("agent-1", { name: "Updated Name" });
    expect(await screen.findByText("Updated Name")).toBeInTheDocument();
  });

  it("cancels name editing on Escape without sending patch request", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent name" })[0]);
    const nameInput = screen.getByDisplayValue("Overview Agent");
    await user.clear(nameInput);
    await user.type(nameInput, "Changed Name{Escape}");

    expect(patchAgentMock).not.toHaveBeenCalled();
    expect(screen.getByText("Overview Agent")).toBeInTheDocument();
  });

  it("does not send patch on unchanged name when saving via outside click", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent name" })[0]);
    await user.click(screen.getByText("ID: agent-1"));

    expect(patchAgentMock).not.toHaveBeenCalled();
    expect(screen.getByText("Overview Agent")).toBeInTheDocument();
  });

  it("saves edited description via Save button and sends only description field", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    patchAgentMock.mockResolvedValue({
      ...agent,
      description: "Updated description",
      updatedAt: "2026-04-13T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent description" })[0]);
    const descriptionInput = screen.getByDisplayValue("Agent overview description");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "  Updated description  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentMock).toHaveBeenCalledWith("agent-1", { description: "Updated description" });
    expect(await screen.findByText("Updated description")).toBeInTheDocument();
  });

  it("allows clearing description and sends null in patch payload", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    patchAgentMock.mockResolvedValue({
      ...agent,
      description: null,
      updatedAt: "2026-04-13T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent description" })[0]);
    const descriptionInput = screen.getByDisplayValue("Agent overview description");
    await user.clear(descriptionInput);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentMock).toHaveBeenCalledWith("agent-1", { description: null });
    expect(await screen.findByText("No description yet.")).toBeInTheDocument();
  });

  it("skips patch when description stays empty after edit", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      description: null,
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent description" })[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentMock).not.toHaveBeenCalled();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });

  it("prevents duplicate submits while description save is in progress", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    let resolvePatch: ((value: typeof agent) => void) | null = null;
    patchAgentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        })
    );
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent description" })[0]);
    const descriptionInput = screen.getByDisplayValue("Agent overview description");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Queued description");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await user.click(saveButton);
    await user.click(saveButton);

    expect(patchAgentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    await act(async () => {
      resolvePatch?.({
        ...agent,
        description: "Queued description",
        updatedAt: "2026-04-13T12:00:00.000Z",
      });
    });

    expect(await screen.findByText("Queued description")).toBeInTheDocument();
  });

  it("shows recoverable error on save failure and allows successful retry", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    patchAgentMock
      .mockRejectedValueOnce(new Error("Patch failed"))
      .mockResolvedValueOnce({
        ...agent,
        description: "Recovered description",
        updatedAt: "2026-04-13T12:00:00.000Z",
      });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit agent description" })[0]);
    const descriptionInput = screen.getByDisplayValue("Agent overview description");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Recovered description");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Patch failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Recovered description")).toBeInTheDocument();
    expect(screen.queryByText("Patch failed")).not.toBeInTheDocument();
  });

  it("saves edited instruction and sends only instruction in patch payload", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    patchAgentMock.mockResolvedValue({
      ...agent,
      instruction: "Updated instruction text",
      updatedAt: "2026-04-13T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add agent instruction" }));
    await user.type(screen.getByRole("textbox"), "  Updated instruction text  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(patchAgentMock).toHaveBeenCalledWith("agent-1", { instruction: "Updated instruction text" });
    expect(await screen.findByText("Updated instruction text")).toBeInTheDocument();
  });

  it("cancels instruction edit without sending patch request", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      instruction: "Current instruction",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit agent instruction" }));
    const instructionTextarea = screen.getByRole("textbox");
    await user.clear(instructionTextarea);
    await user.type(instructionTextarea, "Changed instruction");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(patchAgentMock).not.toHaveBeenCalled();
    expect(screen.getByText("Current instruction")).toBeInTheDocument();
  });

  it("shows Activate for DRAFT and updates to ACTIVE after successful activation", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    activateAgentMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
      updatedAt: "2026-04-14T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));

    expect(activateAgentMock).toHaveBeenCalledWith("agent-1");
    expect(await screen.findAllByText("ACTIVE")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
    const lifecycleSection = screen.getByRole("heading", { name: "Lifecycle actions" }).closest("section");
    expect(lifecycleSection).not.toBeNull();
    expect(within(lifecycleSection as HTMLElement).queryByRole("button", { name: "Chat" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("givenActiveAgent_whenChatClicked_thenNavigatesToChatPage", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Chat" }));

    expect(await screen.findByText("Agent Chat Page")).toBeInTheDocument();
  });

  it("archives ACTIVE agent without confirmation", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
    });
    archiveAgentMock.mockResolvedValue({
      ...agent,
      status: "ARCHIVED",
      updatedAt: "2026-04-14T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(archiveAgentMock).toHaveBeenCalledWith("agent-1");
    expect(await screen.findAllByText("ARCHIVED")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("restores ARCHIVED agent to DRAFT without confirmation", async () => {
    getAgentByIdMock.mockResolvedValue({ ...agent, status: "ARCHIVED" });
    restoreAgentMock.mockResolvedValue({
      ...agent,
      status: "DRAFT",
      updatedAt: "2026-04-14T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(restoreAgentMock).toHaveBeenCalledWith("agent-1");
    expect(await screen.findAllByText("DRAFT")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("prevents duplicate lifecycle submit while activation is in progress", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    let resolveActivate: ((value: typeof agent) => void) | null = null;
    activateAgentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveActivate = resolve;
        })
    );
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    const activateButton = screen.getByRole("button", { name: "Activate" });
    await user.click(activateButton);
    await user.click(activateButton);

    expect(activateAgentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Activating..." })).toBeDisabled();

    await act(async () => {
      resolveActivate?.({
        ...agent,
        status: "ACTIVE",
        updatedAt: "2026-04-14T12:00:00.000Z",
      });
    });

    expect(await screen.findByRole("button", { name: "Archive" })).toBeInTheDocument();
  });

  it("shows lifecycle error and allows retry to succeed", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    activateAgentMock
      .mockRejectedValueOnce(new Error("Activate failed"))
      .mockResolvedValueOnce({
        ...agent,
        status: "ACTIVE",
        updatedAt: "2026-04-14T12:00:00.000Z",
      });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));
    expect(await screen.findByText("Activate failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));

    expect(activateAgentMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.queryByText("Activate failed")).not.toBeInTheDocument();
  });

  it("prevents duplicate archive submit while archiving is in progress", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
    });
    let resolveArchive: ((value: typeof agent) => void) | null = null;
    archiveAgentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveArchive = resolve;
        })
    );
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    const archiveButton = screen.getByRole("button", { name: "Archive" });
    await user.click(archiveButton);
    await user.click(archiveButton);

    expect(archiveAgentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Archiving..." })).toBeDisabled();

    await act(async () => {
      resolveArchive?.({
        ...agent,
        status: "ARCHIVED",
        updatedAt: "2026-04-14T12:00:00.000Z",
      });
    });

    expect(await screen.findAllByText("ARCHIVED")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("shows archive error and allows retry to succeed", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
    });
    archiveAgentMock
      .mockRejectedValueOnce(new Error("Forbidden for workspace scope"))
      .mockResolvedValueOnce({
        ...agent,
        status: "ARCHIVED",
        updatedAt: "2026-04-14T12:00:00.000Z",
      });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(await screen.findByText("Forbidden for workspace scope")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(archiveAgentMock).toHaveBeenCalledTimes(2);
    expect(await screen.findAllByText("ARCHIVED")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.queryByText("Forbidden for workspace scope")).not.toBeInTheDocument();
  });

  it("shows Restore and Delete lifecycle actions for archived status", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ARCHIVED",
    });

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
  });

  it("requires confirmation for Delete and does not call api when user cancels", async () => {
    getAgentByIdMock.mockResolvedValue(agent);
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const deleteDialogHeading = screen.getByRole("heading", { name: "Delete agent?" });
    expect(deleteDialogHeading).toBeInTheDocument();
    expect(deleteAgentMock).not.toHaveBeenCalled();

    const deleteDialog = deleteDialogHeading.closest("div");
    if (!deleteDialog) {
      throw new Error("Delete confirmation dialog not found");
    }
    await user.click(within(deleteDialog).getByRole("button", { name: "Скасувати" }));
    expect(screen.queryByRole("heading", { name: "Delete agent?" })).not.toBeInTheDocument();
    expect(deleteAgentMock).not.toHaveBeenCalled();
  });

  it("deletes agent after confirmation and navigates to automation list", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...agent,
      status: "ACTIVE",
    });
    deleteAgentMock.mockResolvedValue({
      ...agent,
      status: "DELETED",
      updatedAt: "2026-04-14T12:00:00.000Z",
    });
    const user = userEvent.setup();

    renderOverview();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const deleteDialogHeading = screen.getByRole("heading", { name: "Delete agent?" });
    const deleteDialog = deleteDialogHeading.closest("div");
    if (!deleteDialog) {
      throw new Error("Delete confirmation dialog not found");
    }
    await user.click(within(deleteDialog).getByRole("button", { name: "Delete" }));

    expect(deleteAgentMock).toHaveBeenCalledWith("agent-1");
    expect(await screen.findByText("Automation Home")).toBeInTheDocument();
  });
});
