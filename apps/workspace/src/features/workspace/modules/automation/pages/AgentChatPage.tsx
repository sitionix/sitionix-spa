import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PencilLine, Plus, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getAgentById,
  getChatExecutionStatus,
  getAgentConversation,
  getAgentConversations,
  getErrorHttpStatus,
  submitChatExecution,
} from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type {
  AgentConversation,
  AutomationAgent,
  ChatAgentMessage,
  ChatExecutionFailure,
  ChatExecutionState,
} from "../model/types";

type AgentChatState = "loading" | "ready" | "not_found" | "error";

function getStatusBadgeClass(status: AutomationAgent["status"]): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "bg-zinc-100 text-zinc-600";
  }
  return "bg-amber-50 text-amber-700";
}

function formatConversationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AgentChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AutomationAgent | null>(null);
  const [status, setStatus] = useState<AgentChatState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatAgentMessage[]>([]);
  const [isDraftChat, setIsDraftChat] = useState(false);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingConversationDetails, setIsLoadingConversationDetails] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [inFlightExecutionId, setInFlightExecutionId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ChatExecutionState | null>(null);
  const [terminalFailure, setTerminalFailure] = useState<ChatExecutionFailure | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [lastSubmitContext, setLastSubmitContext] = useState<{
    message: string;
    conversationId?: string;
  } | null>(null);

  const isConversationPanelBusy = isLoadingConversations || isLoadingConversationDetails;
  const isExecutionInFlight = executionState === "ACCEPTED" || executionState === "IN_PROGRESS";
  const isSending = isExecutionInFlight;

  const loadConversationDetails = useCallback(async (conversationId: string) => {
    setIsLoadingConversationDetails(true);
    setSendError(null);
    try {
      const details = await getAgentConversation(conversationId);
      setMessages(details.messages);
      setActiveConversationId(details.id);
      setIsDraftChat(false);
    } catch (error) {
      setSendError(toAutomationErrorMessage(error));
      setMessages([]);
      setActiveConversationId(null);
      setIsDraftChat(true);
    } finally {
      setIsLoadingConversationDetails(false);
    }
  }, []);

  const loadConversationList = useCallback(async (agentIdValue: string, openMostRecent: boolean) => {
    setIsLoadingConversations(true);
    try {
      const response = await getAgentConversations(agentIdValue);
      const items = Array.isArray(response?.items) ? response.items : [];
      setConversations(items);

      if (openMostRecent) {
        if (items.length > 0) {
          await loadConversationDetails(items[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
          setIsDraftChat(true);
        }
      }
    } finally {
      setIsLoadingConversations(false);
    }
  }, [loadConversationDetails]);

  useEffect(() => {
    if (!agentId) {
      setStatus("not_found");
      setAgent(null);
      return;
    }

    const load = async () => {
      setStatus("loading");
      setLoadError(null);
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
      setIsDraftChat(false);
      try {
        const loadedAgent = await getAgentById(agentId);
        setAgent(loadedAgent);
        setStatus("ready");

        if (loadedAgent.status === "ACTIVE") {
          await loadConversationList(agentId, true);
        }
      } catch (error) {
        if (getErrorHttpStatus(error) === 404) {
          setStatus("not_found");
          setAgent(null);
          return;
        }
        setStatus("error");
        setLoadError(toAutomationErrorMessage(error));
      }
    };

    void load();
  }, [agentId, loadConversationList]);

  const startNewChat = useCallback(() => {
    if (isExecutionInFlight) {
      return;
    }
    setIsDraftChat(true);
    setActiveConversationId(null);
    setMessages([]);
    setSendError(null);
    setTerminalFailure(null);
  }, [isExecutionInFlight]);

  const openConversation = useCallback(async (conversationId: string) => {
    if (!agentId || isSending) {
      return;
    }
    await loadConversationDetails(conversationId);
  }, [agentId, isSending, loadConversationDetails]);

  const executeSend = useCallback(async (message: string, conversationId?: string) => {
    if (!agent || !agentId || isSending) {
      return;
    }

    setSendError(null);
    setTerminalFailure(null);
    setExecutionState("ACCEPTED");
    setDraftMessage("");

    const optimisticMessage: ChatAgentMessage = {
      id: `temp-user-${Date.now()}`,
      authorType: "USER",
      authorId: "me",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setPendingUserMessage(optimisticMessage.id);

    try {
      const submitResponse = await submitChatExecution(agentId, {
        conversationId,
        message,
      });
      setExecutionState(submitResponse.state);
      setInFlightExecutionId(submitResponse.executionId);
      setActiveConversationId(submitResponse.conversationId);
      setIsDraftChat(false);
      setLastSubmitContext({
        message,
        conversationId,
      });
      await loadConversationList(agentId, false);
    } catch (error) {
      setSendError(toAutomationErrorMessage(error));
      setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
      setPendingUserMessage(null);
      setExecutionState(null);
      setInFlightExecutionId(null);
    }
  }, [agent, agentId, isSending, loadConversationList]);

  const sendMessage = useCallback(async () => {
    const message = draftMessage.trim();
    if (!message) {
      return;
    }
    await executeSend(message, isDraftChat ? undefined : activeConversationId ?? undefined);
  }, [activeConversationId, draftMessage, executeSend, isDraftChat]);

  const retryLastSubmit = useCallback(async () => {
    if (!lastSubmitContext || !agentId || isExecutionInFlight) {
      return;
    }
    setTerminalFailure(null);
    await executeSend(lastSubmitContext.message, lastSubmitContext.conversationId);
  }, [agentId, executeSend, isExecutionInFlight, lastSubmitContext]);

  useEffect(() => {
    if (!agentId || !activeConversationId || !inFlightExecutionId || !isExecutionInFlight) {
      return;
    }

    let cancelled = false;
    const pollExecution = async () => {
      try {
        const statusResponse = await getChatExecutionStatus(agentId, inFlightExecutionId, activeConversationId);
        if (cancelled) {
          return;
        }

        setExecutionState(statusResponse.state);
        if (statusResponse.state === "SUCCEEDED") {
          if (statusResponse.reply) {
            setMessages((current) => {
              const withoutPending = pendingUserMessage
                ? current.filter((item) => item.id !== pendingUserMessage)
                : current;
              const hasReply = withoutPending.some((item) => item.id === statusResponse.reply?.id);
              if (hasReply) {
                return withoutPending;
              }
              return [...withoutPending, statusResponse.reply];
            });
          }
          setPendingUserMessage(null);
          setInFlightExecutionId(null);
          setTerminalFailure(null);
          void loadConversationList(agentId, false);
        } else if (statusResponse.state === "FAILED") {
          setTerminalFailure(statusResponse.failure ?? {
            code: "EXECUTION_FAILED",
            message: "The assistant could not complete this request.",
          });
          setPendingUserMessage(null);
          setInFlightExecutionId(null);
        }
      } catch {
        if (cancelled) {
          return;
        }
        setTerminalFailure({
          code: "POLLING_FAILED",
          message: "Unable to refresh assistant execution status.",
        });
        setPendingUserMessage(null);
        setInFlightExecutionId(null);
        setExecutionState("FAILED");
      }
    };

    void pollExecution();
    const intervalId = window.setInterval(() => {
      void pollExecution();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeConversationId, agentId, inFlightExecutionId, isExecutionInFlight, loadConversationList, pendingUserMessage]);

  const pageTitle = useMemo(() => {
    if (isDraftChat) {
      return "New chat";
    }

    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    return activeConversation?.title ?? "Conversation";
  }, [activeConversationId, conversations, isDraftChat]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading agent chat...</span>
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-8 py-14 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Agent not found</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
          We could not find this agent in your workspace scope.
        </p>
        <Link
          to="/automation"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Automation
        </Link>
      </div>
    );
  }

  if (status === "error" || !agent) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-lg font-semibold text-red-900">Unable to load Agent Chat</h1>
        <p className="mt-2 text-sm text-red-700">{loadError ?? "Unexpected error"}</p>
      </div>
    );
  }

  if (agent.status !== "ACTIVE") {
    const guardMessage = agent.status === "DRAFT"
      ? "Activate agent to start chatting."
      : "Restore the agent first.";
    return (
      <div className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900">{agent.name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>
            {agent.status}
          </span>
        </div>
        <p className="text-sm text-zinc-600">{guardMessage}</p>
        <Link
          to={`/automation/agents/${agent.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{agent.name}</h1>
            <p className="mt-2 text-sm text-zinc-600">Direct persistent agent conversations.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>
              {agent.status}
            </span>
            <Link
              to={`/automation/agents/${agent.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-zinc-200 bg-white p-4">
          <button
            type="button"
            onClick={startNewChat}
            disabled={isSending}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>

          {isLoadingConversations ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversations...
            </div>
          ) : null}

          {!isLoadingConversations && conversations.length === 0 ? (
            <p className="text-sm text-zinc-500">No conversations yet.</p>
          ) : null}

          <div className="space-y-2">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId && !isDraftChat;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void openConversation(conversation.id)}
                  disabled={isSending}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${active
                    ? "border-blue-300 bg-blue-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
                >
                  <p className="truncate text-sm font-medium text-zinc-900">{conversation.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatConversationDate(conversation.lastMessageAt)}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex min-h-[320px] flex-col rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">{pageTitle}</h2>

            {isConversationPanelBusy ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            ) : null}

            {!isConversationPanelBusy && messages.length === 0 && isDraftChat ? (
              <p className="text-sm text-zinc-500">Start a new conversation with this agent.</p>
            ) : null}

            {!isConversationPanelBusy && messages.length === 0 && !isDraftChat ? (
              <p className="text-sm text-zinc-500">No messages in this conversation yet.</p>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.authorType === "USER" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[72%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                    message.authorType === "USER"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isExecutionInFlight ? (
              <div className="mt-auto flex justify-start pt-3" aria-live="polite" aria-label={`${agent.name} typing indicator`}>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-medium leading-5 text-blue-800 shadow-sm">
                  <PencilLine className="h-3.5 w-3.5 animate-pulse text-blue-600" />
                  <span>{agent.name} is typing</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className={`rounded-3xl bg-white p-6 ${sendError ? "border border-red-200" : "border border-zinc-200"}`}>
            <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="agent-chat-input">
              Message
            </label>
            <textarea
              id="agent-chat-input"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              disabled={isSending}
              className="h-28 w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              placeholder="Write your message..."
            />
            {sendError ? (
              <p className="mt-3 text-sm text-red-700">{sendError}</p>
            ) : null}
            {terminalFailure ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">{terminalFailure.code}</p>
                <p className="mt-1">{terminalFailure.message}</p>
                <button
                  type="button"
                  onClick={() => void retryLastSubmit()}
                  disabled={isExecutionInFlight}
                  className="mt-3 inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isSending || !draftMessage.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
