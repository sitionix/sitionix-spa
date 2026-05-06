import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../ui/components/PageHeader";
import { formatDate } from "../../../model/formatters";
import { getAgentProject, getErrorHttpStatus } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AgentProject } from "../model/types";

type AgentProjectDetailsPageState = "idle" | "loading" | "ready" | "not_found" | "error";

function getStatusBadgeClass(status: AgentProject["status"]): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "bg-zinc-100 text-zinc-600";
  }
  if (status === "DELETED") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-amber-50 text-amber-700";
}

export function AgentProjectDetailsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<AgentProject | null>(null);
  const [status, setStatus] = useState<AgentProjectDetailsPageState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId?.trim()) {
      setStatus("not_found");
      setProject(null);
      setError(null);
      return;
    }

    setStatus("loading");
    setProject(null);
    setError(null);

    try {
      const response = await getAgentProject(projectId);
      setProject(response);
      setStatus("ready");
    } catch (loadError) {
      if (getErrorHttpStatus(loadError) === 404) {
        setStatus("not_found");
        return;
      }
      setError(toAutomationErrorMessage(loadError));
      setStatus("error");
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  return (
    <>
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        onClick={() => navigate("/automation?tab=projects")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      {status === "loading" ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading project details...</span>
          </div>
        </div>
      ) : null}

      {status === "not_found" ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Project not found</h2>
          <p className="mt-2 text-sm text-zinc-600">
            This project may have been deleted or you may not have access to it.
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-lg font-semibold text-red-900">Unable to load project details</h2>
          <p className="mt-2 text-sm text-red-700">{error ?? "Unknown error"}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
            onClick={() => void loadProject()}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : null}

      {status === "ready" && project ? (
        <>
          <PageHeader
            title={project.name}
            subtitle={project.description?.trim() ? project.description : "No description yet."}
            actions={(
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(project.status)}`}>
                {project.status}
              </span>
            )}
          />

          <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid gap-2 text-sm text-zinc-600">
              <div>Created {formatDate(project.createdAt)}</div>
              <div>Updated {formatDate(project.updatedAt)}</div>
            </div>
          </div>

          <div className="grid gap-4">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Agents</h2>
              <p className="mt-2 text-sm text-zinc-600">Project agents will appear here.</p>
              <p className="mt-1 text-sm text-zinc-500">Soon you will be able to attach agents to this project.</p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Conversations</h2>
              <p className="mt-2 text-sm text-zinc-600">Project conversations will appear here.</p>
              <p className="mt-1 text-sm text-zinc-500">Soon you will be able to start project-bound conversations.</p>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
