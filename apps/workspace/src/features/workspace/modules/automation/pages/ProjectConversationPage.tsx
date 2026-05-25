import { ArrowLeft, Loader2, MessageSquare, Paperclip, Plus, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorHttpStatus, getProjectConversation, submitProjectConversationExecution } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type {
  ChatAgentMessage,
  ProjectConversationDetails,
  ProjectConversationExecutionStatus,
  ProjectConversationParticipant,
} from "../model/types";

type PageStatus = "idle" | "loading" | "ready" | "not_found" | "error";
type DotVariant = "active" | "archived" | "deleted" | "draft" | "unknown";

function getStatusDotVariant(status: ProjectConversationParticipant["status"]): DotVariant {
  if (status === "ACTIVE") return "active";
  if (status === "ARCHIVED") return "archived";
  if (status === "DELETED") return "deleted";
  if (status === "DRAFT") return "draft";
  return "unknown";
}

function getStatusDotClassName(variant: DotVariant): string {
  if (variant === "active") return "bg-emerald-500";
  if (variant === "archived") return "bg-zinc-400";
  if (variant === "deleted") return "bg-rose-500";
  if (variant === "draft") return "bg-amber-500";
  return "bg-zinc-300";
}

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
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
    const diff = getMessageTimestamp(left) - getMessageTimestamp(right);
    if (diff !== 0) return diff;
    return left.id.localeCompare(right.id);
  });
}

function isTerminalExecutionStatus(status: ProjectConversationExecutionStatus): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "DISPATCH_SKIPPED";
}

export function ProjectConversationPage() {
  const navigate = useNavigate();
  const { projectId, conversationId } = useParams<{ projectId: string; conversationId: string }>();
  const [status, setStatus] = useState<PageStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ProjectConversationDetails | null>(null);
  const [messages, setMessages] = useState<ChatAgentMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingExecution, setIsAwaitingExecution] = useState(false);

  const applyConversation = useCallback((response: ProjectConversationDetails) => {
    setConversation(response);
    setMessages((current) => dedupeAndSortMessages([...current, ...(Array.isArray(response.messages) ? response.messages : [])]));
  }, []);

  const loadConversation = useCallback(async () => {
    if (!projectId?.trim() || !conversationId?.trim()) {
      setStatus("not_found");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await getProjectConversation(projectId, conversationId);
      applyConversation(response);
      setStatus("ready");
    } catch (loadError) {
      if (getErrorHttpStatus(loadError) === 404) {
        setStatus("not_found");
        return;
      }
      setError(toAutomationErrorMessage(loadError));
      setStatus("error");
    }
  }, [applyConversation, conversationId, projectId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const participants = useMemo(() => {
    return (conversation?.participants ?? []).filter((participant) => participant.type === "AGENT");
  }, [conversation?.participants]);

  const canSendMessages = conversation?.canSendMessages === true;

  const submitMessage = useCallback(async () => {
    const message = draftMessage.trim();
    if (!conversation?.id || !message || isSending || !canSendMessages) {
      return;
    }

    setSubmitError(null);
    setDraftMessage("");
    setIsSending(true);

    const optimisticMessage: ChatAgentMessage = {
      id: `temp-user-${Date.now()}`,
      authorType: "USER",
      authorId: "me",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => dedupeAndSortMessages([...current, optimisticMessage]));

    try {
      const response = await submitProjectConversationExecution(conversation.id, { message });
      if (response.inputMessageId) {
        setMessages((current) => dedupeAndSortMessages(current.map((currentMessage) => (
          currentMessage.id === optimisticMessage.id
            ? { ...currentMessage, id: response.inputMessageId }
            : currentMessage
        ))));
      }

      const isTerminal = isTerminalExecutionStatus(response.executionStatus);
      setIsAwaitingExecution(!isTerminal);

      const updatedConversation = await getProjectConversation(projectId ?? "", response.conversationId);
      applyConversation(updatedConversation);
      setIsAwaitingExecution(false);
    } catch (submitExecutionError) {
      setSubmitError(toAutomationErrorMessage(submitExecutionError));
      setMessages((current) => current.filter((currentMessage) => currentMessage.id !== optimisticMessage.id));
      setIsAwaitingExecution(false);
    } finally {
      setIsSending(false);
    }
  }, [applyConversation, canSendMessages, conversation?.id, draftMessage, isSending, projectId]);

  return (
    <>
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        onClick={() => navigate(`/automation/projects/${encodeURIComponent(projectId ?? "")}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </button>

      {status === "loading" ? <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white"><div className="flex items-center gap-3 text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" />Loading conversation...</div></div> : null}
      {status === "not_found" ? <div className="rounded-3xl border border-zinc-200 bg-white p-8"><h2 className="text-xl font-semibold text-zinc-900">Conversation not found</h2><p className="mt-2 text-sm text-zinc-600">This conversation may have been deleted or you may not have access to it.</p></div> : null}
      {status === "error" ? <div className="rounded-3xl border border-red-200 bg-red-50 p-8"><h2 className="text-lg font-semibold text-red-900">Unable to load conversation</h2><p className="mt-2 text-sm text-red-700">{error ?? "Unknown error"}</p></div> : null}

      {status === "ready" && conversation ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            <header className="rounded-3xl border border-zinc-200 bg-white p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-zinc-100 p-2 text-zinc-700"><MessageSquare className="h-5 w-5" /></div><div><h1 className="text-2xl font-semibold text-zinc-900">Team chat</h1><p className="text-sm text-zinc-600">Project conversation</p></div></div></header>
            <section className="flex min-h-[560px] flex-col rounded-3xl border border-zinc-200 bg-white">
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-[420px] items-center justify-center"><div className="max-w-md text-center"><div className="mx-auto mb-4 inline-flex rounded-2xl bg-zinc-100 p-3 text-zinc-500"><MessageSquare className="h-7 w-7" /></div><h2 className="text-xl font-semibold text-zinc-900">No messages yet</h2><p className="mt-2 text-sm text-zinc-600">Start the conversation with your first message.</p></div></div>
                ) : messages.map((message) => {
                  const isUser = message.authorType === "USER";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"}`}>
                        {message.content}
                      </div>
                    </div>
                  );
                })}
                {isAwaitingExecution ? <div className="text-sm text-zinc-500">Assistant is processing...</div> : null}
              </div>

              <div className="border-t border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700">
                  <Paperclip className="h-4 w-4 text-zinc-400" />
                  <input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitMessage();
                      }
                    }}
                    disabled={isSending || !canSendMessages}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
                    placeholder={canSendMessages ? "Type your message..." : "Messaging is disabled"}
                  />
                  <button
                    type="button"
                    onClick={() => void submitMessage()}
                    disabled={isSending || !canSendMessages || !draftMessage.trim()}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-400"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {submitError ? <p className="mt-2 text-sm text-red-700">{submitError}</p> : null}
              </div>
            </section>
          </section>

          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Conversation details</h2>
            <div className="mt-5 rounded-2xl border border-zinc-200 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Project</p><div className="mt-2 flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-700">{getInitials(conversation.project?.name ?? "Unknown")}</span><span className="text-sm font-medium text-zinc-900">{conversation.project?.name ?? "Unknown"}</span></div></div>
            <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700" disabled><Plus className="h-4 w-4" />Add agent</button>
            <section className="mt-5"><h3 className="text-sm font-semibold text-zinc-900">Team ({participants.length})</h3><ul className="mt-3 space-y-2">{participants.map((participant) => { const statusDotClassName = getStatusDotClassName(getStatusDotVariant(participant.status)); const key = participant.agentId ?? `${participant.name}-${participant.status}`; return (<li key={key} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5"><div className="relative"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{getInitials(participant.name)}</span><span data-testid={`status-dot-${participant.name}`} className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDotClassName}`} /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-900">{participant.name}</p><p className="truncate text-xs text-zinc-500">{participant.description?.trim() ? participant.description : "No description yet."}</p></div></li>); })}</ul></section>
          </aside>
        </div>
      ) : null}
    </>
  );
}
