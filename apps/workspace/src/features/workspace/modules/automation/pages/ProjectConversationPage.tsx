import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../ui/components/PageHeader";
import { getErrorHttpStatus, getProjectConversation } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { ProjectConversationDetails } from "../model/types";

type PageStatus = "idle" | "loading" | "ready" | "not_found" | "error";

export function ProjectConversationPage() {
  const navigate = useNavigate();
  const { projectId, conversationId } = useParams<{ projectId: string; conversationId: string }>();
  const [status, setStatus] = useState<PageStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ProjectConversationDetails | null>(null);

  const loadConversation = useCallback(async () => {
    if (!projectId?.trim() || !conversationId?.trim()) {
      setStatus("not_found");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await getProjectConversation(projectId, conversationId);
      setConversation(response);
      setStatus("ready");
    } catch (loadError) {
      if (getErrorHttpStatus(loadError) === 404) {
        setStatus("not_found");
        return;
      }
      setError(toAutomationErrorMessage(loadError));
      setStatus("error");
    }
  }, [conversationId, projectId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

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
        <>
          <PageHeader title={conversation.title || "Project chat"} subtitle="Project conversation shell." />
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-600">Project: <span className="font-semibold text-zinc-900">{conversation.project?.name ?? "Unknown"}</span></p>
            <p className="mt-2 text-sm text-zinc-600">Type: <span className="font-semibold text-zinc-900">{conversation.type}</span></p>
            <h2 className="mt-6 text-lg font-semibold text-zinc-900">Team</h2>
            <ul className="mt-3 grid gap-2">
              {conversation.participants.filter((participant) => participant.type === "AGENT").map((participant) => (
                <li key={participant.agentId ?? participant.name} className="rounded-xl border border-zinc-200 p-3">
                  <p className="text-sm font-semibold text-zinc-900">{participant.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{participant.description?.trim() ? participant.description : "No description yet."}</p>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-lg font-semibold text-zinc-900">Messages</h2>
            <p className="mt-2 text-sm text-zinc-600">No messages yet.</p>
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-600">Messaging for project conversations is not available yet.</p>
              <textarea disabled rows={3} className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500" placeholder="Messaging is disabled" />
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
