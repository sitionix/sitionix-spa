import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Clock3, Loader2, Settings, Sparkles, Wand2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../ui/components/PageHeader";
import { formatDateTime } from "../../../model/formatters";
import { getAgentById, getErrorHttpStatus } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AutomationAgent } from "../model/types";

type AgentOverviewState = "idle" | "loading" | "ready" | "not_found" | "error";

function SectionPlaceholder({
  title,
  description,
  actionLabel,
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
}>) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      {actionLabel ? (
        <button
          type="button"
          disabled
          className="mt-5 inline-flex cursor-not-allowed items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-500"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export function AgentOverviewPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AutomationAgent | null>(null);
  const [status, setStatus] = useState<AgentOverviewState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadAgent = useCallback(async () => {
    if (!agentId) {
      setStatus("not_found");
      setAgent(null);
      setError(null);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await getAgentById(agentId);
      setAgent(response);
      setStatus("ready");
    } catch (loadError) {
      const statusCode = getErrorHttpStatus(loadError);
      if (statusCode === 404) {
        setStatus("not_found");
        setAgent(null);
        setError(null);
        return;
      }
      setStatus("error");
      setError(toAutomationErrorMessage(loadError));
    }
  }, [agentId]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading agent overview...</span>
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
        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          onClick={() => navigate("/automation")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Automation
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-lg font-semibold text-red-900">Unable to load Agent Overview</h1>
        <p className="mt-2 text-sm text-red-700">{error ?? "Unexpected error"}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
            onClick={() => void loadAgent()}
          >
            Retry
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-red-200 bg-transparent px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
            onClick={() => navigate("/automation")}
          >
            Back to Automation
          </button>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Agent Overview"
        subtitle="Main workspace home for this automation agent."
        actions={
          <>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-500"
            >
              <Settings className="h-4 w-4" />
              Configure (Soon)
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => navigate("/automation")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </>
        }
      />

      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-semibold text-zinc-900">{agent.name}</h1>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                {agent.status}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">{agent.description}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
            <div>ID: {agent.id}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Overview</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-2 font-medium text-zinc-900">{agent.status}</dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <dt className="text-zinc-500">Created</dt>
                <dd className="mt-2 font-medium text-zinc-900">{formatDateTime(agent.createdAt)}</dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <dt className="text-zinc-500">Updated</dt>
                <dd className="mt-2 font-medium text-zinc-900">{formatDateTime(agent.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <SectionPlaceholder
            title="Configuration"
            description="Define this agent's role, instruction, and operating guidance here."
            actionLabel="Configure agent (Soon)"
          />

          <SectionPlaceholder
            title="Rules"
            description="Rules help shape how this agent should behave. No rules have been added yet."
            actionLabel="Add rules (Soon)"
          />
        </div>

        <aside className="grid gap-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Suggested guidance</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Sparkles className="h-4 w-4" />
                Future insights
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                System recommendations and suggested improvements will appear here.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Activity</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Clock3 className="h-4 w-4" />
                History will appear here
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Execution and change history will become available in upcoming releases.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Quick actions</h2>
            <button
              type="button"
              disabled
              className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-500"
            >
              <Wand2 className="h-4 w-4" />
              Edit agent (Soon)
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
