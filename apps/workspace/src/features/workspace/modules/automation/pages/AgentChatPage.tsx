import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AgentConversationDetails,
  AutomationAgent,
  ChatAgentMessage,
  ChatExecutionFailure,
  ChatExecutionLifecycleStatus,
  ChatExecutionState,
} from "../model/types";

type AgentChatState = "loading" | "ready" | "not_found" | "error";

type LatestExecution = {
  executionId: string;
  status: ChatExecutionLifecycleStatus;
  errorCode?: string;
  errorMessage?: string;
  assistantMessage?: ChatAgentMessage;
} | null;

function isLifecycleInFlight(status: ChatExecutionLifecycleStatus | null | undefined): boolean {
  return status === "QUEUED" || status === "PENDING" || status === "RUNNING";
}

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

function getLatestExecution(details: AgentConversationDetails): LatestExecution {
  if (!Array.isArray(details.executions) || details.executions.length === 0) {
    return null;
  }
  const withTimestamp = details.executions.map((execution) => {
    const timestamp = execution.completedAt ?? execution.startedAt ?? execution.acceptedAt;
    const numeric = new Date(timestamp).getTime();
    return {
      execution,
      numeric: Number.isNaN(numeric) ? Number.MIN_SAFE_INTEGER : numeric,
    };
  });
  withTimestamp.sort((left, right) => right.numeric - left.numeric);
  const latest = withTimestamp[0]?.execution;
  if (!latest) {
    return null;
  }
  return {
    executionId: latest.executionId,
    status: latest.status,
    errorCode: latest.errorCode,
    errorMessage: latest.errorMessage,
    assistantMessage: latest.assistantMessage,
  };
}

function getMessageTimestamp(message: ChatAgentMessage): number {
  const numeric = new Date(message.createdAt).getTime();
  return Number.isNaN(numeric) ? Number.MAX_SAFE_INTEGER : numeric;
}

function dedupeAndSortMessages(messages: ChatAgentMessage[]): ChatAgentMessage[] {
  const byId = new Map<string, ChatAgentMessage>();
  for (const message of messages) {
    byId.set(message.id, message);
  }
  return Array.from(byId.values()).sort((left, right) => {
    const timeDiff = getMessageTimestamp(left) - getMessageTimestamp(right);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return left.id.localeCompare(right.id);
  });
}

function mergeMessages(current: ChatAgentMessage[], backend: ChatAgentMessage[], preserveLocalUserMessages: boolean): ChatAgentMessage[] {
  const backendMessages = dedupeAndSortMessages(Array.isArray(backend) ? backend : []);
  if (!preserveLocalUserMessages) {
    return backendMessages;
  }

  const mergedById = new Map<string, ChatAgentMessage>(backendMessages.map((message) => [message.id, message]));
  const backendUserContents = new Set(
    backendMessages
      .filter((message) => message.authorType === "USER")
      .map((message) => message.content),
  );

  for (const message of current) {
    if (message.authorType !== "USER") {
      continue;
    }
    if (!mergedById.has(message.id)) {
      mergedById.set(message.id, message);
    }
  }

  for (const message of current) {
    if (!message.id.startsWith("temp-user-")) {
      continue;
    }
    const hasPersistedEquivalent = backendUserContents.has(message.content);
    if (!hasPersistedEquivalent && !mergedById.has(message.id)) {
      mergedById.set(message.id, message);
    }
  }

  return dedupeAndSortMessages(Array.from(mergedById.values()));
}

function getSelectedConversationStorageKey(agentIdValue: string): string {
  return `automation:selectedConversation:${agentIdValue}`;
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
  const [latestExecutionStatus, setLatestExecutionStatus] = useState<ChatExecutionLifecycleStatus | null>(null);
  const [lastSubmitContext, setLastSubmitContext] = useState<{
    message: string;
    conversationId?: string;
  } | null>(null);

  const pollInFlightRef = useRef(false);
  const latestExecutionStatusRef = useRef<ChatExecutionLifecycleStatus | null>(null);
  const inFlightExecutionIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const detailsRequestVersionRef = useRef(0);
  const authoritativeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    latestExecutionStatusRef.current = latestExecutionStatus;
  }, [latestExecutionStatus]);

  useEffect(() => {
    inFlightExecutionIdRef.current = inFlightExecutionId;
  }, [inFlightExecutionId]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const isConversationPanelBusy = isLoadingConversations || isLoadingConversationDetails;
  const isExecutionInFlight = isLifecycleInFlight(latestExecutionStatus);
  const isSending = executionState === "ACCEPTED" || executionState === "IN_PROGRESS";

  const saveSelectedConversationId = useCallback((conversationId: string | null) => {
    if (!agentId) {
      return;
    }
    const storageKey = getSelectedConversationStorageKey(agentId);
    if (!conversationId) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, conversationId);
  }, [agentId]);

  const getStoredSelectedConversationId = useCallback((): string | null => {
    if (!agentId) {
      return null;
    }
    return window.localStorage.getItem(getSelectedConversationStorageKey(agentId));
  }, [agentId]);

  const applyConversationDetailsState = useCallback((details: AgentConversationDetails, options?: { preserveLocalOptimistic?: boolean; syncSelection?: boolean }) => {
    const latestExecution = getLatestExecution(details);
    const pendingOrRunning = isLifecycleInFlight(latestExecution?.status);
    const preserveLocalExecution = Boolean(options?.preserveLocalOptimistic
      && !latestExecution
      && isLifecycleInFlight(latestExecutionStatusRef.current));
    const preserveLocalUserMessages = Boolean(options?.preserveLocalOptimistic);

    setMessages((current) => mergeMessages(
      current,
      Array.isArray(details.messages) ? details.messages : [],
      preserveLocalUserMessages,
    ));
    if (options?.syncSelection !== false) {
      setActiveConversationId(details.id);
      setIsDraftChat(false);
      saveSelectedConversationId(details.id);
    }

    if (preserveLocalExecution) {
      return;
    }

    setLatestExecutionStatus(latestExecution?.status ?? null);
    setInFlightExecutionId(latestExecution?.executionId ?? null);

    if (latestExecution?.status === "FAILED") {
      setExecutionState("FAILED");
      setTerminalFailure({
        code: latestExecution.errorCode ?? "EXECUTION_FAILED",
        message: latestExecution.errorMessage ?? "Agent failed to respond. Try again.",
      });
      return;
    }

    if (latestExecution?.status === "COMPLETED") {
      setExecutionState("COMPLETED");
      setTerminalFailure(null);
      return;
    }

    if (pendingOrRunning) {
      setExecutionState(latestExecution.status === "RUNNING" ? "IN_PROGRESS" : "ACCEPTED");
      setTerminalFailure(null);
      return;
    }

    setExecutionState(null);
    setTerminalFailure(null);
  }, [saveSelectedConversationId]);

  const loadConversationDetails = useCallback(async (
    conversationId: string,
    options?: { silent?: boolean; preserveLocalOptimistic?: boolean; syncSelection?: boolean },
  ): Promise<AgentConversationDetails | null> => {
    const shouldSyncSelection = options?.syncSelection !== false;
    const requestVersion = shouldSyncSelection
      ? ++detailsRequestVersionRef.current
      : detailsRequestVersionRef.current;

    if (!options?.silent) {
      setIsLoadingConversationDetails(true);
      setSendError(null);
    }

    try {
      const details = await getAgentConversation(conversationId);
      if (shouldSyncSelection && requestVersion !== detailsRequestVersionRef.current) {
        return details;
      }
      if (shouldSyncSelection
        && authoritativeConversationIdRef.current
        && authoritativeConversationIdRef.current !== conversationId) {
        return details;
      }
      applyConversationDetailsState(details, {
        preserveLocalOptimistic: options?.preserveLocalOptimistic,
        syncSelection: options?.syncSelection,
      });
      return details;
    } catch (error) {
      if (!options?.silent) {
        setSendError(toAutomationErrorMessage(error));
        setMessages([]);
        setActiveConversationId(null);
        setIsDraftChat(true);
      }
      return null;
    } finally {
      if (!options?.silent) {
        setIsLoadingConversationDetails(false);
      }
    }
  }, [applyConversationDetailsState]);

  const loadConversationList = useCallback(async (agentIdValue: string, options?: { openInitial?: boolean; preferredConversationId?: string | null }) => {
    setIsLoadingConversations(true);
    try {
      const response = await getAgentConversations(agentIdValue);
      const items = Array.isArray(response?.items) ? response.items : [];
      setConversations(items);

      if (!options?.openInitial) {
        return;
      }

      const preferred = options.preferredConversationId
        ?? getStoredSelectedConversationId();

      if (preferred && items.some((item) => item.id === preferred)) {
        await loadConversationDetails(preferred);
        return;
      }

      if (items.length > 0) {
        await loadConversationDetails(items[0].id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
        setIsDraftChat(true);
        saveSelectedConversationId(null);
      }
    } finally {
      setIsLoadingConversations(false);
    }
  }, [getStoredSelectedConversationId, loadConversationDetails, saveSelectedConversationId]);

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
      authoritativeConversationIdRef.current = null;
      detailsRequestVersionRef.current += 1;
      setIsDraftChat(false);
      setLatestExecutionStatus(null);
      setInFlightExecutionId(null);
      setTerminalFailure(null);
      pollInFlightRef.current = false;
      try {
        const loadedAgent = await getAgentById(agentId);
        setAgent(loadedAgent);
        setStatus("ready");

        if (loadedAgent.status === "ACTIVE") {
          await loadConversationList(agentId, { openInitial: true });
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
    if (isSending || isExecutionInFlight) {
      return;
    }
    authoritativeConversationIdRef.current = null;
    detailsRequestVersionRef.current += 1;
    setIsDraftChat(true);
    setActiveConversationId(null);
    setMessages([]);
    setSendError(null);
    setTerminalFailure(null);
    setLatestExecutionStatus(null);
    setInFlightExecutionId(null);
    saveSelectedConversationId(null);
  }, [isExecutionInFlight, isSending, saveSelectedConversationId]);

  const openConversation = useCallback(async (conversationId: string) => {
    if (!agentId || isSending) {
      return;
    }
    authoritativeConversationIdRef.current = conversationId;
    await loadConversationDetails(conversationId);
  }, [agentId, isSending, loadConversationDetails]);

  const executeSend = useCallback(async (message: string, conversationId?: string) => {
    if (!agent || !agentId || isSending) {
      return;
    }

    setSendError(null);
    setTerminalFailure(null);
    setExecutionState("ACCEPTED");
    setLatestExecutionStatus("PENDING");
    setDraftMessage("");

    const optimisticMessage: ChatAgentMessage = {
      id: `temp-user-${Date.now()}`,
      authorType: "USER",
      authorId: "me",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const submitResponse = await submitChatExecution(agentId, {
        conversationId,
        message,
      });

      setExecutionState(submitResponse.state);
      setInFlightExecutionId(submitResponse.executionId);
      setActiveConversationId(submitResponse.conversationId);
      authoritativeConversationIdRef.current = submitResponse.conversationId;
      detailsRequestVersionRef.current += 1;
      setLatestExecutionStatus(submitResponse.lifecycleStatus);
      inFlightExecutionIdRef.current = submitResponse.executionId;
      latestExecutionStatusRef.current = submitResponse.lifecycleStatus;
      const persistedUserMessageId = submitResponse.inputMessageId;
      if (persistedUserMessageId) {
        setMessages((current) => dedupeAndSortMessages(current.map((item) => {
          if (item.id !== optimisticMessage.id) {
            return item;
          }
          return {
            ...item,
            id: persistedUserMessageId,
          };
        })));
      }
      setIsDraftChat(false);
      setLastSubmitContext({ message, conversationId });
      saveSelectedConversationId(submitResponse.conversationId);

      await loadConversationList(agentId, { openInitial: false });
      await loadConversationDetails(submitResponse.conversationId, {
        silent: true,
        preserveLocalOptimistic: true,
      });
    } catch (error) {
      setSendError(toAutomationErrorMessage(error));
      setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
      setExecutionState(null);
      setInFlightExecutionId(null);
      setLatestExecutionStatus(null);
    }
  }, [agent, agentId, isSending, loadConversationDetails, loadConversationList, saveSelectedConversationId]);

  const sendMessage = useCallback(async () => {
    const message = draftMessage.trim();
    if (!message) {
      return;
    }
    await executeSend(message, isDraftChat ? undefined : activeConversationId ?? undefined);
  }, [activeConversationId, draftMessage, executeSend, isDraftChat]);

  const retryLastSubmit = useCallback(async () => {
    if (!lastSubmitContext || !agentId || isSending || isExecutionInFlight) {
      return;
    }
    setTerminalFailure(null);
    await executeSend(lastSubmitContext.message, lastSubmitContext.conversationId);
  }, [agentId, executeSend, isExecutionInFlight, isSending, lastSubmitContext]);

  useEffect(() => {
    if (!agentId || !activeConversationId || !isExecutionInFlight) {
      return;
    }

    let cancelled = false;

    const pollExecution = async () => {
      if (pollInFlightRef.current) {
        return;
      }
      pollInFlightRef.current = true;
      try {
        const details = await loadConversationDetails(activeConversationId, {
          silent: true,
          preserveLocalOptimistic: true,
          syncSelection: false,
        });
        if (cancelled || activeConversationIdRef.current !== activeConversationId) {
          return;
        }

        const latestExecution = details ? getLatestExecution(details) : null;
        const executionIdForStatus = inFlightExecutionIdRef.current;
        if (!latestExecution && executionIdForStatus) {
          const statusResponse = await getChatExecutionStatus(agentId, executionIdForStatus, activeConversationId);
          if (cancelled) {
            return;
          }
          if (statusResponse.state === "FAILED") {
            setExecutionState("FAILED");
            setLatestExecutionStatus("FAILED");
            setInFlightExecutionId(null);
            setTerminalFailure(statusResponse.failure ?? {
              code: "EXECUTION_FAILED",
              message: "The assistant could not complete this request.",
            });
          } else if (statusResponse.state === "COMPLETED") {
            setExecutionState("COMPLETED");
            setLatestExecutionStatus("COMPLETED");
            setInFlightExecutionId(null);
            setTerminalFailure(null);
            if (statusResponse.reply) {
              setMessages((current) => mergeMessages(current, [statusResponse.reply], true));
            }
          } else {
            setExecutionState(statusResponse.state);
            setLatestExecutionStatus(statusResponse.state === "IN_PROGRESS" ? "RUNNING" : "PENDING");
          }
        }
      } catch {
        if (cancelled) {
          return;
        }
        setTerminalFailure({
          code: "POLLING_FAILED",
          message: "Unable to refresh assistant execution status.",
        });
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void pollExecution();
    const intervalId = window.setInterval(() => {
      void pollExecution();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      pollInFlightRef.current = false;
    };
  }, [activeConversationId, agentId, inFlightExecutionId, isExecutionInFlight, loadConversationDetails]);

  const pageTitle = useMemo(() => {
    if (isDraftChat) {
      return "New chat";
    }

    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    return activeConversation?.title ?? "Conversation";
  }, [activeConversationId, conversations, isDraftChat]);

  const showDraftEmptyState = !isConversationPanelBusy
    && messages.length === 0
    && isDraftChat;

  const showConversationEmptyState = !isConversationPanelBusy
    && messages.length === 0
    && !isDraftChat
    && !isExecutionInFlight;

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

            {showDraftEmptyState ? (
              <p className="text-sm text-zinc-500">Start a new conversation with this agent.</p>
            ) : null}

            {showConversationEmptyState ? (
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
