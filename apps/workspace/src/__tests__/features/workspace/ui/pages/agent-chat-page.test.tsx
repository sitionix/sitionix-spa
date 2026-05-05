import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentChatPage } from "../../../../../features/workspace/modules/automation/pages/AgentChatPage";
import {
  deleteAgentConversation,
  getAgentById,
  getChatExecutionStatus,
  getAgentConversation,
  getAgentConversations,
  getErrorHttpStatus,
  submitChatExecution,
} from "../../../../../features/workspace/modules/automation/api";

vi.mock("../../../../../features/workspace/modules/automation/api", () => ({
  submitChatExecution: vi.fn(),
  getChatExecutionStatus: vi.fn(),
  getAgentById: vi.fn(),
  getAgentConversation: vi.fn(),
  getAgentConversations: vi.fn(),
  getErrorHttpStatus: vi.fn(),
  deleteAgentConversation: vi.fn(),
}));

const submitChatExecutionMock = vi.mocked(submitChatExecution);
const getChatExecutionStatusMock = vi.mocked(getChatExecutionStatus);
const getAgentByIdMock = vi.mocked(getAgentById);
const getAgentConversationMock = vi.mocked(getAgentConversation);
const getAgentConversationsMock = vi.mocked(getAgentConversations);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);
const deleteAgentConversationMock = vi.mocked(deleteAgentConversation);

function renderChatPage(initialPath = "/automation/agents/agent-1/chat") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/automation" element={<div>Automation Home</div>} />
        <Route path="/automation/agents/:agentId" element={<div>Agent Overview Page</div>} />
        <Route path="/automation/agents/:agentId/chat" element={<AgentChatPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const activeAgent = {
  id: "agent-1",
  name: "Active Agent",
  description: "Description",
  instruction: "Instruction",
  status: "ACTIVE" as const,
  createdAt: "2026-04-10T10:00:00.000Z",
  updatedAt: "2026-04-10T10:00:00.000Z",
};

describe("AgentChatPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    submitChatExecutionMock.mockReset();
    getChatExecutionStatusMock.mockReset();
    getAgentByIdMock.mockReset();
    getAgentConversationMock.mockReset();
    getAgentConversationsMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    deleteAgentConversationMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("givenActiveAgentWithConversations_whenPageLoaded_thenOpensMostRecentConversationByDefault", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-2",
          title: "Most recent",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:02:00.000Z",
          lastMessageAt: "2026-04-21T10:02:00.000Z",
        },
        {
          id: "conv-1",
          title: "Older",
          type: "DIRECT",
          createdAt: "2026-04-20T10:00:00.000Z",
          updatedAt: "2026-04-20T10:01:00.000Z",
          lastMessageAt: "2026-04-20T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-2",
      title: "Most recent",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:02:00.000Z",
      lastMessageAt: "2026-04-21T10:02:00.000Z",
      messages: [
        {
          id: "msg-1",
          authorType: "USER",
          authorId: "user-1",
          content: "first",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
        {
          id: "msg-2",
          authorType: "AGENT",
          authorId: "agent-1",
          content: "reply",
          createdAt: "2026-04-21T10:02:00.000Z",
        },
      ],
    });

    renderChatPage();

    expect(await screen.findByRole("heading", { name: "Active Agent" })).toBeInTheDocument();
    expect(screen.getByText("Direct persistent agent conversations.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Most recent" })).toBeInTheDocument();
    expect(await screen.findByText("first")).toBeInTheDocument();
    expect(await screen.findByText("reply")).toBeInTheDocument();
    expect(getAgentConversationMock).toHaveBeenCalledWith("conv-2");
  });

  it("givenNoConversations_whenPageLoaded_thenShowsEmptyDraftState", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({ items: [] });

    renderChatPage();

    expect(await screen.findByText("No conversations yet.")).toBeInTheDocument();
    expect(screen.getByText("Start a new conversation with this agent.")).toBeInTheDocument();
    expect(getAgentConversationMock).not.toHaveBeenCalled();
  });

  it("givenActiveConversation_whenNewChatClicked_thenResetsToDraftWithoutCallingChatApi", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "Existing",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-1",
      title: "Existing",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [
        {
          id: "msg-1",
          authorType: "AGENT",
          authorId: "agent-1",
          content: "existing reply",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("existing reply");
    await user.click(screen.getByRole("button", { name: "New chat" }));

    expect(screen.getByRole("heading", { level: 2, name: "New chat" })).toBeInTheDocument();
    expect(screen.getByText("Start a new conversation with this agent.")).toBeInTheDocument();
    expect(submitChatExecutionMock).not.toHaveBeenCalled();
  });

  it("givenDraftChat_whenFirstMessageSent_thenCallsChatWithoutConversationId", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-created",
            title: "New",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-1",
      state: "IN_PROGRESS",
      conversationId: "conv-created",
      lifecycleStatus: "RUNNING",
    });
    getChatExecutionStatusMock.mockResolvedValue({
      executionId: "exec-1",
      state: "COMPLETED",
      conversationId: "conv-created",
      reply: {
        id: "msg-reply",
        authorType: "AGENT",
        authorId: "agent-1",
        content: "created",
        createdAt: "2026-04-21T10:01:00.000Z",
      },
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "  Explain architecture  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(submitChatExecutionMock).toHaveBeenCalledWith("agent-1", {
      message: "Explain architecture",
    });
    expect(await screen.findByText("created")).toBeInTheDocument();
  });

  it("givenPersistedConversation_whenMessageSent_thenCallsChatWithConversationIdAndKeepsOptimisticMessage", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-1",
            title: "Existing",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-1",
            title: "Existing",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:02:00.000Z",
            lastMessageAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      });
    getAgentConversationMock
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [],
        executions: [],
      })
      .mockResolvedValue({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:02:00.000Z",
        lastMessageAt: "2026-04-21T10:02:00.000Z",
        messages: [],
        executions: [
          {
            executionId: "exec-1",
            status: "RUNNING",
            acceptedAt: "2026-04-21T10:01:01.000Z",
            startedAt: "2026-04-21T10:01:02.000Z",
            completedAt: null,
          },
        ],
      });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-1",
      state: "IN_PROGRESS",
      conversationId: "conv-1",
      lifecycleStatus: "RUNNING",
    });
    getChatExecutionStatusMock.mockResolvedValue({
      executionId: "exec-1",
      state: "COMPLETED",
      conversationId: "conv-1",
      reply: {
        id: "msg-reply",
        authorType: "AGENT",
        authorId: "agent-1",
        content: "continued",
        createdAt: "2026-04-21T10:02:00.000Z",
      },
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No messages in this conversation yet.");
    await user.type(screen.getByLabelText("Message"), "next");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(submitChatExecutionMock).toHaveBeenCalledWith("agent-1", {
      conversationId: "conv-1",
      message: "next",
    });
    expect(await screen.findByText("next")).toBeInTheDocument();
    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();
  });

  it("givenSubmitReturnsUserMessageId_whenBackendMessagesArrive_thenRendersSingleUserMessage", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-1",
            title: "Existing",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      })
      .mockResolvedValue({
        items: [
          {
            id: "conv-1",
            title: "Existing",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:02:00.000Z",
            lastMessageAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      });
    getAgentConversationMock
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [],
        executions: [],
      })
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:02:00.000Z",
        lastMessageAt: "2026-04-21T10:02:00.000Z",
        messages: [
          {
            id: "msg-user-1",
            authorType: "USER",
            authorId: "user-1",
            content: "привіт",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
          {
            id: "msg-agent-1",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "reply",
            createdAt: "2026-04-21T10:02:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-1",
            status: "COMPLETED",
            acceptedAt: "2026-04-21T10:01:00.000Z",
            completedAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-1",
      state: "ACCEPTED",
      conversationId: "conv-1",
      inputMessageId: "msg-user-1",
      lifecycleStatus: "QUEUED",
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No messages in this conversation yet.");
    await user.type(screen.getByLabelText("Message"), "привіт");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("reply")).toBeInTheDocument();
    expect(screen.getAllByText("привіт")).toHaveLength(1);
  });

  it("givenExistingConversationClicked_whenConversationOpened_thenLoadsAndRendersItsHistory", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "First",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
        {
          id: "conv-2",
          title: "Second",
          type: "DIRECT",
          createdAt: "2026-04-21T11:00:00.000Z",
          updatedAt: "2026-04-21T11:01:00.000Z",
          lastMessageAt: "invalid-date",
        },
      ],
    });
    getAgentConversationMock
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "First",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [
          {
            id: "msg-1",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "first history",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "conv-2",
        title: "Second",
        type: "DIRECT",
        createdAt: "2026-04-21T11:00:00.000Z",
        updatedAt: "2026-04-21T11:01:00.000Z",
        lastMessageAt: "2026-04-21T11:01:00.000Z",
        messages: [
          {
            id: "msg-2",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "second history",
            createdAt: "2026-04-21T11:01:00.000Z",
          },
        ],
      });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("first history");
    expect(screen.getByText("invalid-date")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Second/ }));

    expect(getAgentConversationMock).toHaveBeenLastCalledWith("conv-2");
    expect(await screen.findByText("second history")).toBeInTheDocument();
  });

  it("givenInFlightSend_whenSendClickedTwice_thenPreventsDuplicateRequest", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-1",
            title: "Created",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });

    let resolveSubmit: ((value: {
      executionId: string;
      state: "IN_PROGRESS";
      conversationId: string;
      lifecycleStatus: "RUNNING";
    }) => void) | null = null;

    submitChatExecutionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
    );

    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "concurrency check");

    const sendButton = screen.getByRole("button", { name: "Send" });
    await user.click(sendButton);
    await user.click(sendButton);

    expect(submitChatExecutionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();
    getChatExecutionStatusMock.mockResolvedValue({
      executionId: "exec-1",
      state: "COMPLETED",
      conversationId: "conv-1",
      reply: {
        id: "reply-1",
        authorType: "AGENT",
        authorId: "agent-1",
        content: "done",
        createdAt: "2026-04-21T10:01:00.000Z",
      },
    });

    await act(async () => {
      resolveSubmit?.({
        executionId: "exec-1",
        state: "IN_PROGRESS",
        conversationId: "conv-1",
        lifecycleStatus: "RUNNING",
      });
    });
    expect(await screen.findByText("done")).toBeInTheDocument();
  });

  it("givenNonActiveDraftAgent_whenPageLoaded_thenRendersDraftGuardState", async () => {
    getAgentByIdMock.mockResolvedValue({
      ...activeAgent,
      status: "DRAFT",
      name: "Draft Agent",
    });

    renderChatPage();

    expect(await screen.findByText("Activate agent to start chatting.")).toBeInTheDocument();
    expect(getAgentConversationsMock).not.toHaveBeenCalled();
  });

  it("givenAgentLoadReturns404_whenPageLoaded_thenRendersNotFoundState", async () => {
    getAgentByIdMock.mockRejectedValue(new Error("Not found"));
    getErrorHttpStatusMock.mockReturnValue(404);

    renderChatPage();

    expect(await screen.findByText("Agent not found")).toBeInTheDocument();
    expect(screen.getByText("Back to Automation")).toBeInTheDocument();
  });

  it("givenBlankInput_whenPageLoaded_thenSendButtonRemainsDisabled", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({ items: [] });

    renderChatPage();

    await screen.findByText("No conversations yet.");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("givenExecutionFailed_whenRetryClicked_thenRetriesSameMessage", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({
        items: [
          {
            id: "conv-1",
            title: "Created",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });
    submitChatExecutionMock
      .mockResolvedValueOnce({
        executionId: "exec-failed",
        state: "IN_PROGRESS",
        conversationId: "conv-1",
        lifecycleStatus: "RUNNING",
      })
      .mockResolvedValueOnce({
        executionId: "exec-retry",
        state: "IN_PROGRESS",
        conversationId: "conv-1",
        lifecycleStatus: "RUNNING",
      });
    getChatExecutionStatusMock
      .mockResolvedValueOnce({
        executionId: "exec-failed",
        state: "FAILED",
        conversationId: "conv-1",
        failure: {
          code: "AGENT_TIMEOUT",
          message: "Execution timed out",
        },
      })
      .mockResolvedValueOnce({
        executionId: "exec-retry",
        state: "COMPLETED",
        conversationId: "conv-1",
        reply: {
          id: "reply-retry",
          authorType: "AGENT",
          authorId: "agent-1",
          content: "retry ok",
          createdAt: "2026-04-21T10:02:00.000Z",
        },
      });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "retry message");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("AGENT_TIMEOUT")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(submitChatExecutionMock).toHaveBeenNthCalledWith(2, "agent-1", {
      message: "retry message",
    });

    expect(await screen.findByText("retry ok")).toBeInTheDocument();
  });

  it("givenConversationWithPendingExecution_whenPageLoaded_thenShowsTypingFromBackendState", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-pending",
          title: "Pending conversation",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-pending",
      title: "Pending conversation",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [
        {
          id: "msg-user",
          authorType: "USER",
          authorId: "user-1",
          content: "need details",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
      ],
      executions: [
        {
          executionId: "exec-pending",
          status: "RUNNING",
          acceptedAt: "2026-04-21T10:01:00.000Z",
          startedAt: "2026-04-21T10:01:02.000Z",
          completedAt: null,
        },
      ],
    });

    renderChatPage();

    expect(await screen.findByText("need details")).toBeInTheDocument();
    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();
  });

  it("givenConversationWithFailedExecution_whenPageLoaded_thenShowsSafeFailureAndKeepsUserMessage", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-failed",
          title: "Failed conversation",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-failed",
      title: "Failed conversation",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [
        {
          id: "msg-user",
          authorType: "USER",
          authorId: "user-1",
          content: "need details",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
      ],
      executions: [
        {
          executionId: "exec-failed",
          status: "FAILED",
          acceptedAt: "2026-04-21T10:01:00.000Z",
          startedAt: "2026-04-21T10:01:02.000Z",
          completedAt: "2026-04-21T10:01:30.000Z",
          errorCode: "EXECUTION_FAILED",
          errorMessage: "Agent failed to respond. Try again.",
        },
      ],
    });

    renderChatPage();

    expect(await screen.findByText("need details")).toBeInTheDocument();
    expect(screen.getByText("EXECUTION_FAILED")).toBeInTheDocument();
    expect(screen.queryByLabelText("Active Agent typing indicator")).not.toBeInTheDocument();
  });

  it("givenSendAcceptedWithQueuedStatus_whenMessageSent_thenShowsTypingImmediately", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [] });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-queued",
      state: "ACCEPTED",
      conversationId: "conv-queued",
      lifecycleStatus: "QUEUED",
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-queued",
      title: "Queued",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
      executions: [],
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();
  });

  it("givenSendAcceptedWithPendingStatus_whenMessageSent_thenShowsTypingImmediately", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [] });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-pending",
      state: "ACCEPTED",
      conversationId: "conv-pending",
      lifecycleStatus: "PENDING",
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-pending",
      title: "Pending",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
      executions: [],
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();
  });

  it("givenPollingDetailsContainExecutionMetadata_whenExecutionPending_thenDoesNotCallExecutionStatusFallback", async () => {
    vi.useFakeTimers();
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-meta",
          title: "Meta",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-meta",
      title: "Meta",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
      executions: [
        {
          executionId: "exec-meta",
          status: "RUNNING",
          acceptedAt: "2026-04-21T10:01:00.000Z",
          startedAt: "2026-04-21T10:01:02.000Z",
          completedAt: null,
        },
      ],
    });

    renderChatPage();

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
      vi.advanceTimersByTime(4500);
    });

    expect(getChatExecutionStatusMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("givenPollingDetailsMissingExecutionMetadata_whenExecutionPending_thenCallsExecutionStatusFallbackOnlyOnce", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({
        items: [
          {
            id: "conv-fallback",
            title: "Fallback",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-fallback",
      state: "ACCEPTED",
      conversationId: "conv-fallback",
      inputMessageId: "msg-fallback",
      lifecycleStatus: "QUEUED",
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-fallback",
      title: "Fallback",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
      executions: [],
    });
    getChatExecutionStatusMock.mockResolvedValue({
      executionId: "exec-fallback",
      state: "IN_PROGRESS",
      conversationId: "conv-fallback",
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(getChatExecutionStatusMock).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });
    expect(getChatExecutionStatusMock).toHaveBeenCalledTimes(1);
  });

  it("givenQueuedExecution_whenPollingReturnsCompletedWithAssistantMessage_thenUpdatesUiAndStopsTyping", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({
        items: [
          {
            id: "conv-live",
            title: "Live",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });
    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-live",
      state: "ACCEPTED",
      conversationId: "conv-live",
      lifecycleStatus: "QUEUED",
    });
    getAgentConversationMock
      .mockResolvedValueOnce({
        id: "conv-live",
        title: "Live",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [],
        executions: [],
      })
      .mockResolvedValueOnce({
        id: "conv-live",
        title: "Live",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:02:00.000Z",
        lastMessageAt: "2026-04-21T10:02:00.000Z",
        messages: [
          {
            id: "msg-user-live",
            authorType: "USER",
            authorId: "user-1",
            content: "live",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
          {
            id: "msg-agent-live",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "live reply",
            createdAt: "2026-04-21T10:02:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-live",
            status: "COMPLETED",
            acceptedAt: "2026-04-21T10:01:00.000Z",
            completedAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      })
      .mockResolvedValue({
        id: "conv-live",
        title: "Live",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:02:00.000Z",
        lastMessageAt: "2026-04-21T10:02:00.000Z",
        messages: [
          {
            id: "msg-user-live",
            authorType: "USER",
            authorId: "user-1",
            content: "live",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
          {
            id: "msg-agent-live",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "live reply",
            createdAt: "2026-04-21T10:02:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-live",
            status: "COMPLETED",
            acceptedAt: "2026-04-21T10:01:00.000Z",
            completedAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "live");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("live reply", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByLabelText("Active Agent typing indicator")).not.toBeInTheDocument();
    expect(screen.getAllByText("live reply")).toHaveLength(1);
  });

  it("givenPollingReturnsAssistantOnly_whenExecutionInFlight_thenKeepsExistingUserMessageVisible", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "Existing",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [
          {
            id: "msg-user-1",
            authorType: "USER",
            authorId: "user-1",
            content: "привіт",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-1",
            status: "RUNNING",
            acceptedAt: "2026-04-21T10:01:00.000Z",
            startedAt: "2026-04-21T10:01:02.000Z",
            completedAt: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "conv-1",
        title: "Existing",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:02:00.000Z",
        lastMessageAt: "2026-04-21T10:02:00.000Z",
        messages: [
          {
            id: "msg-assistant-1",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "reply",
            createdAt: "2026-04-21T10:02:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-1",
            status: "COMPLETED",
            acceptedAt: "2026-04-21T10:01:00.000Z",
            completedAt: "2026-04-21T10:02:00.000Z",
          },
        ],
      });

    renderChatPage();

    expect(await screen.findByText("привіт")).toBeInTheDocument();
    expect(await screen.findByText("reply", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("привіт")).toBeInTheDocument();
  });

  it("givenRunningExecutionWithMultipleConversations_whenPolling_thenRequestsOnlyActiveConversationDetails", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-active",
          title: "Active",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
        {
          id: "conv-other",
          title: "Other",
          type: "DIRECT",
          createdAt: "2026-04-21T11:00:00.000Z",
          updatedAt: "2026-04-21T11:01:00.000Z",
          lastMessageAt: "2026-04-21T11:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-active",
      title: "Active",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [
        {
          id: "msg-user",
          authorType: "USER",
          authorId: "user-1",
          content: "pending",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
      ],
      executions: [
        {
          executionId: "exec-active",
          status: "RUNNING",
          acceptedAt: "2026-04-21T10:01:00.000Z",
          startedAt: "2026-04-21T10:01:02.000Z",
          completedAt: null,
        },
      ],
    });

    renderChatPage();
    expect(await screen.findByText("pending")).toBeInTheDocument();

    await waitFor(() => {
      expect(getAgentConversationMock.mock.calls.length).toBeGreaterThan(1);
    }, { timeout: 4500 });

    const requestedConversationIds = getAgentConversationMock.mock.calls.map(([conversationId]) => conversationId);
    expect(requestedConversationIds).toEqual(expect.arrayContaining(["conv-active"]));
    expect(requestedConversationIds).not.toEqual(expect.arrayContaining(["conv-other"]));
  });

  it("givenPendingExecutionAndSlowPolling_whenIntervalTicks_thenSkipsOverlappingPollCalls", async () => {
    vi.useFakeTimers();
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-pending",
          title: "Pending conversation",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });

    let resolveConversation: ((value: {
      id: string;
      title: string;
      type: "DIRECT";
      createdAt: string;
      updatedAt: string;
      lastMessageAt: string;
      messages: Array<{
        id: string;
        authorType: "USER";
        authorId: string;
        content: string;
        createdAt: string;
      }>;
      executions: Array<{
        executionId: string;
        status: "RUNNING";
        acceptedAt: string;
      }>;
    }) => void) | null = null;

    getAgentConversationMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConversation = resolve as typeof resolveConversation;
        }),
    );

    renderChatPage();

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(getAgentConversationMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(4500);
    });

    expect(getAgentConversationMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveConversation?.({
        id: "conv-pending",
        title: "Pending conversation",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [
          {
            id: "msg-user",
            authorType: "USER",
            authorId: "user-1",
            content: "need details",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-pending",
            status: "RUNNING",
            acceptedAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(getAgentConversationMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("givenLateInitialDetailsResponse_whenSubmitCreatesConversation_thenDoesNotOverrideActiveConversation", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock
      .mockResolvedValueOnce({
        items: [
          {
            id: "conv-old",
            title: "Old",
            type: "DIRECT",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:01:00.000Z",
            lastMessageAt: "2026-04-21T10:01:00.000Z",
          },
        ],
      })
      .mockResolvedValue({
        items: [
          {
            id: "conv-new",
            title: "New",
            type: "DIRECT",
            createdAt: "2026-04-21T10:02:00.000Z",
            updatedAt: "2026-04-21T10:03:00.000Z",
            lastMessageAt: "2026-04-21T10:03:00.000Z",
          },
        ],
      });

    let resolveOldDetails: ((value: {
      id: string;
      title: string;
      type: "DIRECT";
      createdAt: string;
      updatedAt: string;
      lastMessageAt: string;
      messages: ChatMessageDto[];
      executions: ExecutionDto[];
    }) => void) | null = null;

    type ChatMessageDto = {
      id: string;
      authorType: "USER" | "AGENT";
      authorId: string;
      content: string;
      createdAt: string;
    };
    type ExecutionDto = {
      executionId: string;
      status: "QUEUED" | "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
      acceptedAt: string;
      startedAt?: string | null;
      completedAt?: string | null;
    };

    getAgentConversationMock.mockImplementation((conversationId: string) => {
      if (conversationId === "conv-old") {
        return new Promise((resolve) => {
          resolveOldDetails = resolve as typeof resolveOldDetails;
        });
      }
      return Promise.resolve({
        id: "conv-new",
        title: "New",
        type: "DIRECT",
        createdAt: "2026-04-21T10:02:00.000Z",
        updatedAt: "2026-04-21T10:03:00.000Z",
        lastMessageAt: "2026-04-21T10:03:00.000Z",
        messages: [
          {
            id: "msg-user-new",
            authorType: "USER",
            authorId: "user-1",
            content: "Привіт",
            createdAt: "2026-04-21T10:02:10.000Z",
          },
          {
            id: "msg-agent-new",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "reply",
            createdAt: "2026-04-21T10:03:00.000Z",
          },
        ],
        executions: [
          {
            executionId: "exec-new",
            status: "COMPLETED",
            acceptedAt: "2026-04-21T10:02:10.000Z",
            completedAt: "2026-04-21T10:03:00.000Z",
          },
        ],
      });
    });

    submitChatExecutionMock.mockResolvedValue({
      executionId: "exec-new",
      state: "ACCEPTED",
      conversationId: "conv-new",
      inputMessageId: "msg-user-new",
      lifecycleStatus: "QUEUED",
    });

    const user = userEvent.setup();
    renderChatPage();

    await user.type(await screen.findByLabelText("Message"), "Привіт");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await act(async () => {
      resolveOldDetails?.({
        id: "conv-old",
        title: "Old",
        type: "DIRECT",
        createdAt: "2026-04-21T10:00:00.000Z",
        updatedAt: "2026-04-21T10:01:00.000Z",
        lastMessageAt: "2026-04-21T10:01:00.000Z",
        messages: [
          {
            id: "msg-old",
            authorType: "AGENT",
            authorId: "agent-1",
            content: "stale old",
            createdAt: "2026-04-21T10:01:00.000Z",
          },
        ],
        executions: [],
      });
    });

    expect(await screen.findByRole("heading", { level: 2, name: "New" })).toBeInTheDocument();
    expect(screen.queryByText("stale old")).not.toBeInTheDocument();
    expect(screen.getByText("Привіт")).toBeInTheDocument();
  });

  it("givenConversationDeleteCanceled_whenDialogClosed_thenKeepsConversation", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "First",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-1",
      title: "First",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("button", { name: /First/ });
    await user.click(screen.getAllByRole("button", { name: "Delete conversation" })[0]);
    expect(screen.getByText("Delete conversation?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Delete conversation?")).not.toBeInTheDocument();
    expect(deleteAgentConversationMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /First/ })).toBeInTheDocument();
  });

  it("givenConversationDeleteConfirmed_whenDeleteClicked_thenDeletesWithoutSelectingConversation", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "First",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
        {
          id: "conv-2",
          title: "Second",
          type: "DIRECT",
          createdAt: "2026-04-21T11:00:00.000Z",
          updatedAt: "2026-04-21T11:01:00.000Z",
          lastMessageAt: "2026-04-21T11:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-1",
      title: "First",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
    });
    deleteAgentConversationMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("button", { name: /First/ });
    await user.click(screen.getAllByRole("button", { name: "Delete conversation" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteAgentConversationMock).toHaveBeenCalledWith("conv-1");
    });
    expect(screen.queryByRole("button", { name: /First/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Second/ })).toBeInTheDocument();
  });

  it("givenDeleteFailed_whenConfirmed_thenShowsErrorAndKeepsConversation", async () => {
    getAgentByIdMock.mockResolvedValue(activeAgent);
    getAgentConversationsMock.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          title: "First",
          type: "DIRECT",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:01:00.000Z",
          lastMessageAt: "2026-04-21T10:01:00.000Z",
        },
      ],
    });
    getAgentConversationMock.mockResolvedValue({
      id: "conv-1",
      title: "First",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
    });
    deleteAgentConversationMock.mockRejectedValue(new Error("Forbidden"));
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("button", { name: /First/ });
    await user.click(screen.getByRole("button", { name: "Delete conversation" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /First/ })).toBeInTheDocument();
  });
});
