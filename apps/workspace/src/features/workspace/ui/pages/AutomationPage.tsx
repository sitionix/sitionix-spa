import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, Plus, RefreshCw } from "lucide-react";
import { getAgents, type AutomationAgent } from "../../api/agentsApi";
import { formatDate } from "../../model/formatters";
import { CreateAgentSheet } from "../components/CreateAgentSheet";
import { PageHeader } from "../components/PageHeader";

const toErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unexpected error";
};

export function AutomationPage() {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [agents, setAgents] = useState<AutomationAgent[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const response = await getAgents();
      setAgents(response);
      setStatus("ready");
    } catch (loadError) {
      setError(toErrorMessage(loadError));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const handleCreated = useCallback((createdAgent: AutomationAgent) => {
    setAgents((currentAgents) => [createdAgent, ...currentAgents]);
    setCreateSheetOpen(false);
    setStatus("ready");
    setError(null);
  }, []);

  return (
    <>
      <PageHeader
        title="Automation"
        subtitle="Minimal Agent foundation for internal automation workflows."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => setCreateSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        }
      />

      {status === "loading" ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading agents...</span>
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-lg font-semibold text-red-900">Не вдалося завантажити Automation</h2>
          <p className="mt-2 text-sm text-red-700">{error ?? "Unknown error"}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
            onClick={() => void loadAgents()}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : null}

      {status === "ready" && agents.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Bot className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-zinc-900">No agents yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
            Create the first Agent to verify the end-to-end Automation flow through Workspace,
            BFF, service and Postgres.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => setCreateSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>
      ) : null}

      {status === "ready" && agents.length > 0 ? (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">{agent.name}</h2>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                    {agent.description}
                  </p>
                </div>
                <div className="min-w-[160px] text-right text-xs text-zinc-500">
                  <div>Created {formatDate(agent.createdAt)}</div>
                  <div className="mt-2">Updated {formatDate(agent.updatedAt)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <CreateAgentSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
