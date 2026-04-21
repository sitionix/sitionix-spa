import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, PencilLine, RefreshCw, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { chatAgent, getAgentById, getErrorHttpStatus } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AutomationAgent } from "../model/types";

type AgentChatState = "loading" | "ready" | "not_found" | "error";
type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  failed?: boolean;
  error?: string | null;
};

function getStatusBadgeClass(status: AutomationAgent["status"]): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "bg-zinc-100 text-zinc-600";
  }
  return "bg-amber-50 text-amber-700";
}

export function AgentChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AutomationAgent | null>(null);
  const [status, setStatus] = useState<AgentChatState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setStatus("not_found");
      setAgent(null);
      return;
    }

    const load = async () => {
      setStatus("loading");
      setLoadError(null);
      try {
        const loadedAgent = await getAgentById(agentId);
        setAgent(loadedAgent);
        setStatus("ready");
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
  }, [agentId]);

  const deliverMessage = useCallback(async (messageText: string, messageId: string) => {
    if (!agentId) {
      return;
    }

    try {
      const response = await chatAgent(agentId, messageText);
      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? { ...message, failed: false, error: null }
          : message
      )));
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: "assistant", text: response.reply },
      ]);
    } catch (error) {
      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? { ...message, failed: true, error: toAutomationErrorMessage(error) }
          : message
      )));
    }
  }, [agentId]);

  const sendMessage = useCallback(async () => {
    if (!agent || !agentId || isSending) {
      return;
    }
    const message = draftMessage.trim();
    if (!message) {
      return;
    }

    setSendError(null);
    setIsSending(true);
    setDraftMessage("");
    const messageId = `${Date.now()}-user`;
    setMessages((current) => [
      ...current,
      { id: messageId, role: "user", text: message, failed: false, error: null },
    ]);

    await deliverMessage(message, messageId);
    setIsSending(false);
  }, [agent, agentId, deliverMessage, draftMessage, isSending]);

  const retryMessage = useCallback(async (messageId: string) => {
    if (isSending) {
      return;
    }

    const messageToRetry = messages.find((message) => message.id === messageId);
    if (!messageToRetry || messageToRetry.role !== "user") {
      setSendError("Unexpected error while retrying message.");
      return;
    }

    setSendError(null);
    setIsSending(true);
    setMessages((current) => current.map((message) => (
      message.id === messageId
        ? { ...message, failed: false, error: null }
        : message
    )));
    await deliverMessage(messageToRetry.text, messageId);
    setIsSending(false);
  }, [deliverMessage, isSending, messages]);

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
            <p className="mt-2 text-sm text-zinc-600">Request-response chat v1 without persistence.</p>
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

      <div className="flex min-h-[320px] flex-col rounded-3xl border border-zinc-200 bg-white p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">Send a message to start the chat.</p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[72%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                message.role === "user"
                  ? (message.failed ? "border border-red-300 bg-red-50 text-red-700" : "bg-blue-600 text-white")
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {message.text}
              {message.role === "user" && message.failed ? (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-red-600">
                    {message.error ?? "Message was not sent."}
                  </span>
                  <button
                    type="button"
                    aria-label="Retry message"
                    disabled={isSending}
                    onClick={() => void retryMessage(message.id)}
                    className="inline-flex items-center rounded-lg border border-red-300 bg-white p-1 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {isSending ? (
          <div className="mt-auto flex justify-start pt-3" aria-live="polite" aria-label={`${agent.name} typing indicator`}>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-medium leading-5 text-blue-800 shadow-sm">
              <PencilLine className="h-3.5 w-3.5 animate-pulse text-blue-600" />
              <span>{agent.name} is typing</span>
              <span className="inline-flex items-center gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600" />
              </span>
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
    </section>
  );
}
