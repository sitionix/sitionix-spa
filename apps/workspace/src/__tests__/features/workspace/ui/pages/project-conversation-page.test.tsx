import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectConversationPage } from "../../../../../features/workspace/modules/automation/pages/ProjectConversationPage";
import {
  getErrorHttpStatus,
  getProjectConversation,
  submitProjectConversationExecution,
} from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  getProjectConversation: vi.fn(),
  getErrorHttpStatus: vi.fn(),
  submitProjectConversationExecution: vi.fn(),
}));

const getProjectConversationMock = vi.mocked(getProjectConversation);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);
const submitProjectConversationExecutionMock = vi.mocked(submitProjectConversationExecution);

describe("ProjectConversationPage", () => {
  beforeEach(() => {
    getProjectConversationMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    submitProjectConversationExecutionMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("renders chat layout, details panel and composer", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      project: { id: "project-1", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [
        { type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: "Reviews output", status: "ARCHIVED" },
      ],
      messages: [],
      canSendMessages: true,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Team chat" })).toBeInTheDocument();
    expect(screen.getByText("Project conversation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conversation details" })).toBeInTheDocument();
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(screen.getByText("Start the conversation with your first message.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add agent" })).toBeDisabled();
    expect(screen.getByText("Team (2)")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });

  it("derives status dot class from participant status", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-2",
      projectId: "project-1",
      project: { id: "project-1", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [
        { type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: "Reviews", status: "ARCHIVED" },
        { type: "AGENT", agentId: "agent-3", name: "Planner", description: "Plans", status: "DELETED" },
        { type: "AGENT", agentId: "agent-4", name: "Researcher", description: "Researches", status: "DRAFT" },
      ],
      messages: [],
      canSendMessages: true,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-2"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("status-dot-Writer")).toHaveClass("bg-emerald-500");
    expect(screen.getByTestId("status-dot-Reviewer")).toHaveClass("bg-zinc-400");
    expect(screen.getByTestId("status-dot-Planner")).toHaveClass("bg-rose-500");
    expect(screen.getByTestId("status-dot-Researcher")).toHaveClass("bg-amber-500");
  });

  it("renders not found when route params are blank", async () => {
    render(
      <MemoryRouter initialEntries={["/automation/projects/%20/conversations/%20"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
    expect(getProjectConversationMock).not.toHaveBeenCalled();
  });

  it("renders not found on 404 response", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("not found"));
    getErrorHttpStatusMock.mockReturnValue(404);

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-404"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
  });

  it("renders generic error when details loading fails", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("Gateway timeout"));

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Unable to load conversation")).toBeInTheDocument();
    expect(screen.getByText("Gateway timeout")).toBeInTheDocument();
  });

  it("navigates back to project details", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      project: { id: "project-1", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [],
      messages: [],
      canSendMessages: true,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
          <Route path="/automation/projects/:projectId" element={<div>Project details page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Team chat" });
    await user.click(screen.getByRole("button", { name: "Back to Project" }));
    expect(await screen.findByText("Project details page")).toBeInTheDocument();
  });

  it("renders fallback values and filters non-agent participants", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-2",
      projectId: "project-2",
      project: null,
      title: "",
      type: "DIRECT",
      status: "ACTIVE",
      participants: [
        { type: "USER", agentId: null, name: "Owner", description: null, status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: " ", status: "ACTIVE" },
      ],
      messages: [
        {
          id: "msg-1",
          authorType: "USER",
          authorId: "user-1",
          content: "Hello",
          createdAt: "2026-05-08T10:00:00Z",
        },
      ],
      canSendMessages: true,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });
    submitProjectConversationExecutionMock.mockResolvedValue({
      conversationId: "conv-2",
      inputMessageId: "msg-2",
      executionId: undefined,
      executionStatus: "DISPATCH_SKIPPED",
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-2/conversations/conv-2"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
    expect(screen.getByText("Team (1)")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Type your message..."), "Need update");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      expect(submitProjectConversationExecutionMock).toHaveBeenCalledWith("conv-2", { message: "Need update" });
    });
    expect(screen.queryByText("Assistant is processing...")).not.toBeInTheDocument();
  });
});
