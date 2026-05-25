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

function getProjectConversationDetails(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
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
    ...overrides,
  };
}

function renderProjectConversationPage(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProjectConversationPage", () => {
  beforeEach(() => {
    getProjectConversationMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    submitProjectConversationExecutionMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("renders chat layout, details panel and composer", async () => {
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails({
      participants: [
        { type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: "Reviews output", status: "ARCHIVED" },
      ],
    }));

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-1");

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
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails({
      id: "conv-2",
      participants: [
        { type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: "Reviews", status: "ARCHIVED" },
        { type: "AGENT", agentId: "agent-3", name: "Planner", description: "Plans", status: "DELETED" },
        { type: "AGENT", agentId: "agent-4", name: "Researcher", description: "Researches", status: "DRAFT" },
      ],
    }));

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-2");

    expect(await screen.findByTestId("status-dot-Writer")).toHaveClass("bg-emerald-500");
    expect(screen.getByTestId("status-dot-Reviewer")).toHaveClass("bg-zinc-400");
    expect(screen.getByTestId("status-dot-Planner")).toHaveClass("bg-rose-500");
    expect(screen.getByTestId("status-dot-Researcher")).toHaveClass("bg-amber-500");
  });

  it("renders not found when route params are blank", async () => {
    renderProjectConversationPage("/automation/projects/%20/conversations/%20");

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
    expect(getProjectConversationMock).not.toHaveBeenCalled();
  });

  it("renders not found on 404 response", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("not found"));
    getErrorHttpStatusMock.mockReturnValue(404);

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-404");

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
  });

  it("renders generic error when details loading fails", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("Gateway timeout"));

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-1");

    expect(await screen.findByText("Unable to load conversation")).toBeInTheDocument();
    expect(screen.getByText("Gateway timeout")).toBeInTheDocument();
  });

  it("navigates back to project details", async () => {
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails());

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
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails({
      id: "conv-2",
      projectId: "project-2",
      project: null,
      title: "",
      type: "DIRECT",
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
    }));
    submitProjectConversationExecutionMock.mockResolvedValue({
      conversationId: "conv-2",
      inputMessageId: "msg-2",
      executionId: undefined,
      executionStatus: "DISPATCH_SKIPPED",
    });
    const user = userEvent.setup();

    renderProjectConversationPage("/automation/projects/project-2/conversations/conv-2");

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

  it("does not submit when composer is disabled by conversation permissions", async () => {
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails({
      id: "conv-3",
      canSendMessages: false,
    }));
    const user = userEvent.setup();

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-3");

    const input = await screen.findByPlaceholderText("Messaging is disabled");
    expect(input).toBeDisabled();
    await user.type(input, "Need update");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(submitProjectConversationExecutionMock).not.toHaveBeenCalled();
  });

  it("rehydrates persisted user message without duplicate optimistic rows after submit", async () => {
    getProjectConversationMock
      .mockResolvedValueOnce(getProjectConversationDetails({
        id: "conv-4",
        messages: [],
      }))
      .mockResolvedValueOnce(getProjectConversationDetails({
        id: "conv-4",
        messages: [
          {
            id: "msg-backend-1",
            authorType: "USER",
            authorId: "user-1",
            content: "Need update",
            createdAt: "2026-05-08T10:00:00Z",
          },
        ],
      }));
    submitProjectConversationExecutionMock.mockResolvedValue({
      conversationId: "conv-4",
      inputMessageId: "msg-backend-1",
      executionId: "exec-1",
      executionStatus: "COMPLETED",
    });
    const user = userEvent.setup();

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-4");

    await screen.findByRole("heading", { name: "Team chat" });
    await user.type(screen.getByPlaceholderText("Type your message..."), "Need update");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(submitProjectConversationExecutionMock).toHaveBeenCalledWith("conv-4", { message: "Need update" });
    });
    await waitFor(() => {
      expect(getProjectConversationMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getAllByText("Need update")).toHaveLength(1);
    expect(screen.queryByText("Assistant is processing...")).not.toBeInTheDocument();
  });

  it("shows processing indicator for in-progress execution and clears it after rehydration", async () => {
    getProjectConversationMock
      .mockResolvedValueOnce(getProjectConversationDetails({
        id: "conv-5",
        messages: [],
      }))
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return getProjectConversationDetails({
          id: "conv-5",
          messages: [
            {
              id: "msg-backend-2",
              authorType: "USER",
              authorId: "user-1",
              content: "Long run",
              createdAt: "2026-05-08T10:00:00Z",
            },
          ],
        });
      });
    submitProjectConversationExecutionMock.mockResolvedValue({
      conversationId: "conv-5",
      inputMessageId: "msg-backend-2",
      executionId: "exec-2",
      executionStatus: "RUNNING",
    });
    const user = userEvent.setup();

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-5");

    await screen.findByRole("heading", { name: "Team chat" });
    await user.type(screen.getByPlaceholderText("Type your message..."), "Long run");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Assistant is processing...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Assistant is processing...")).not.toBeInTheDocument();
    });
  });

  it("removes optimistic message and renders submit error when execution request fails", async () => {
    getProjectConversationMock.mockResolvedValue(getProjectConversationDetails({
      id: "conv-6",
      messages: [],
    }));
    submitProjectConversationExecutionMock.mockRejectedValue(new Error("Submit failed"));
    const user = userEvent.setup();

    renderProjectConversationPage("/automation/projects/project-1/conversations/conv-6");

    await screen.findByRole("heading", { name: "Team chat" });
    await user.type(screen.getByPlaceholderText("Type your message..."), "Will fail");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Submit failed")).toBeInTheDocument();
    expect(screen.queryByText("Will fail")).not.toBeInTheDocument();
  });
});
