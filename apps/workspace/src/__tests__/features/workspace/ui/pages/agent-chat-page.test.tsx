import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AgentChatPage } from "../../../../../features/workspace/modules/automation/pages/AgentChatPage";
import { chatAgent, getAgentById, getErrorHttpStatus } from "../../../../../features/workspace/modules/automation/api";

vi.mock("../../../../../features/workspace/modules/automation/api", () => ({
  chatAgent: vi.fn(),
  getAgentById: vi.fn(),
  getErrorHttpStatus: vi.fn(),
}));

const chatAgentMock = vi.mocked(chatAgent);
const getAgentByIdMock = vi.mocked(getAgentById);
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

describe("AgentChatPage", () => {
  beforeEach(() => {
    chatAgentMock.mockReset();
    getAgentByIdMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("givenActiveAgent_whenPageLoaded_thenRendersChatUi", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Chat Agent",
      description: "Description",
      instruction: "Instruction",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    renderChatPage();

    expect(await screen.findByRole("heading", { name: "Chat Agent" })).toBeInTheDocument();
    expect(screen.getByText("Request-response chat v1 without persistence.")).toBeInTheDocument();
    expect(screen.getByText("Send a message to start the chat.")).toBeInTheDocument();
  });

  it("givenNonActiveDraftAgent_whenPageLoaded_thenRendersDraftGuardState", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Draft Agent",
      description: "Description",
      instruction: "Instruction",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });
    const user = userEvent.setup();

    renderChatPage();

    expect(await screen.findByText("Activate agent to start chatting.")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Back to Overview" }));
    expect(await screen.findByText("Agent Overview Page")).toBeInTheDocument();
  });

  it("givenNonActiveArchivedAgent_whenPageLoaded_thenRendersArchivedGuardState", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Archived Agent",
      description: "Description",
      instruction: "Instruction",
      status: "ARCHIVED",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    renderChatPage();

    expect(await screen.findByText("Restore the agent first.")).toBeInTheDocument();
  });

  it("givenActiveAgent_whenSendMessage_thenCallsApiAndRendersReply", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Active Agent",
      description: "Description",
      instruction: "Instruction",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });
    chatAgentMock.mockResolvedValue({
      reply: "Clean architecture keeps business rules independent.",
    });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("heading", { name: "Active Agent" });
    await user.type(screen.getByLabelText("Message"), "  Explain clean architecture  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(chatAgentMock).toHaveBeenCalledWith("agent-1", "Explain clean architecture");
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(await screen.findByText("Explain clean architecture")).toBeInTheDocument();
    expect(await screen.findByText("Clean architecture keeps business rules independent.")).toBeInTheDocument();
  });

  it("givenInFlightRequest_whenSendClicked_thenDisablesDuplicateSend", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Active Agent",
      description: "Description",
      instruction: "Instruction",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });
    let resolveChat: ((value: { reply: string }) => void) | null = null;
    chatAgentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve;
        })
    );
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("heading", { name: "Active Agent" });
    await user.type(screen.getByLabelText("Message"), "What is SOLID?");

    const sendButton = screen.getByRole("button", { name: "Send" });
    await user.click(sendButton);
    await user.click(sendButton);

    expect(chatAgentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByLabelText("Active Agent is typing")).toBeInTheDocument();

    await act(async () => {
      resolveChat?.({ reply: "SOLID are five principles." });
    });

    expect(screen.queryByLabelText("Active Agent is typing")).not.toBeInTheDocument();
    expect(await screen.findByText("SOLID are five principles.")).toBeInTheDocument();
  });

  it("givenChatRequestFailure_whenSendMessage_thenShowsRetryOnFailedMessageAndKeepsInputCleared", async () => {
    getAgentByIdMock.mockResolvedValue({
      id: "agent-1",
      name: "Active Agent",
      description: "Description",
      instruction: "Instruction",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });
    chatAgentMock
      .mockRejectedValueOnce(new Error("Provider unavailable"))
      .mockResolvedValueOnce({ reply: "Recovered response" });
    const user = userEvent.setup();

    renderChatPage();

    await screen.findByRole("heading", { name: "Active Agent" });
    await user.type(screen.getByLabelText("Message"), "Retry message");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Provider unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Retry message" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry message" }));

    expect(chatAgentMock).toHaveBeenCalledTimes(2);
    expect(chatAgentMock).toHaveBeenNthCalledWith(2, "agent-1", "Retry message");
    expect(await screen.findByText("Recovered response")).toBeInTheDocument();
  });
});
