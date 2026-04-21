import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentChatPage } from "../../../../../features/workspace/modules/automation/pages/AgentChatPage";
import {
  chatAgent,
  getAgentById,
  getAgentConversation,
  getAgentConversations,
  getErrorHttpStatus,
} from "../../../../../features/workspace/modules/automation/api";

vi.mock("../../../../../features/workspace/modules/automation/api", () => ({
  chatAgent: vi.fn(),
  getAgentById: vi.fn(),
  getAgentConversation: vi.fn(),
  getAgentConversations: vi.fn(),
  getErrorHttpStatus: vi.fn(),
}));

const chatAgentMock = vi.mocked(chatAgent);
const getAgentByIdMock = vi.mocked(getAgentById);
const getAgentConversationMock = vi.mocked(getAgentConversation);
const getAgentConversationsMock = vi.mocked(getAgentConversations);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);

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
    chatAgentMock.mockReset();
    getAgentByIdMock.mockReset();
    getAgentConversationMock.mockReset();
    getAgentConversationsMock.mockReset();
    getErrorHttpStatusMock.mockReset();
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
    expect(chatAgentMock).not.toHaveBeenCalled();
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
    chatAgentMock.mockResolvedValue({
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

    expect(chatAgentMock).toHaveBeenCalledWith("agent-1", {
      message: "Explain architecture",
    });
    expect(await screen.findByText("created")).toBeInTheDocument();
  });

  it("givenPersistedConversation_whenMessageSent_thenCallsChatWithConversationId", async () => {
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
    getAgentConversationMock.mockResolvedValue({
      id: "conv-1",
      title: "Existing",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
      messages: [],
    });
    chatAgentMock.mockResolvedValue({
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

    expect(chatAgentMock).toHaveBeenCalledWith("agent-1", {
      conversationId: "conv-1",
      message: "next",
    });
    expect(await screen.findByText("continued")).toBeInTheDocument();
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

    let resolveChat: ((value: {
      conversationId: string;
      reply: {
        id: string;
        authorType: "AGENT";
        authorId: string;
        content: string;
        createdAt: string;
      };
    }) => void) | null = null;

    chatAgentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve;
        })
    );

    const user = userEvent.setup();

    renderChatPage();

    await screen.findByText("No conversations yet.");
    await user.type(screen.getByLabelText("Message"), "concurrency check");

    const sendButton = screen.getByRole("button", { name: "Send" });
    await user.click(sendButton);
    await user.click(sendButton);

    expect(chatAgentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByLabelText("Active Agent typing indicator")).toBeInTheDocument();

    await act(async () => {
      resolveChat?.({
        conversationId: "conv-1",
        reply: {
          id: "reply-1",
          authorType: "AGENT",
          authorId: "agent-1",
          content: "done",
          createdAt: "2026-04-21T10:01:00.000Z",
        },
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
});
