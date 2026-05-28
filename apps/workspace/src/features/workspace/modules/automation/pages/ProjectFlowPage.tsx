import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectFlow, getProjectFlowPalette } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AgentProjectFlow, AgentProjectFlowPaletteSource } from "../model/types";

type RequestState = "idle" | "loading" | "ready" | "error";

export function ProjectFlowPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [flowState, setFlowState] = useState<RequestState>("idle");
  const [paletteState, setPaletteState] = useState<RequestState>("idle");
  const [flow, setFlow] = useState<AgentProjectFlow | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [palette, setPalette] = useState<AgentProjectFlowPaletteSource[]>([]);
  const [paletteError, setPaletteError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId?.trim()) {
      setFlowState("error");
      setFlowError("Invalid project id");
      setPaletteState("error");
      setPaletteError("Invalid project id");
      return;
    }

    setFlowState("loading");
    setFlowError(null);
    setPaletteState("loading");
    setPaletteError(null);

    void getProjectFlow(projectId)
      .then((response) => {
        setFlow(response);
        setFlowState("ready");
      })
      .catch((error: unknown) => {
        setFlowState("error");
        setFlowError(toAutomationErrorMessage(error));
      });

    void getProjectFlowPalette(projectId)
      .then((response) => {
        setPalette(Array.isArray(response.sources) ? response.sources : []);
        setPaletteState("ready");
      })
      .catch((error: unknown) => {
        setPaletteState("error");
        setPaletteError(toAutomationErrorMessage(error));
      });
  }, [projectId]);

  const nodes = useMemo(() => (Array.isArray(flow?.nodes) ? flow.nodes : []), [flow?.nodes]);
  const edges = useMemo(() => (Array.isArray(flow?.edges) ? flow.edges : []), [flow?.edges]);

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

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Project flow</h1>
        <p className="mt-2 text-sm text-zinc-600">Read-only canvas and source palette for this project.</p>
      </div>

      {flowState === "loading" ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading project flow...
          </div>
        </div>
      ) : null}

      {flowState === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-lg font-semibold text-red-900">Unable to load project flow</h2>
          <p className="mt-2 text-sm text-red-700">{flowError ?? "Unknown error"}</p>
        </div>
      ) : null}

      {flowState === "ready" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Canvas</h2>
            <p className="mt-1 text-sm text-zinc-600">{nodes.length} nodes · {edges.length} edges</p>
            {nodes.length === 0 && edges.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
                Empty flow. No nodes or edges available yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {nodes.map((node) => (
                  <article key={node.id} className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{node.nodeType}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">{node.referenceId ?? node.id}</p>
                    <p className="mt-2 text-xs text-zinc-500">x: {node.position.x}, y: {node.position.y}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Palette</h2>
            {paletteState === "loading" ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading palette...
              </div>
            ) : null}
            {paletteState === "error" ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {paletteError ?? "Unable to load palette"}
              </div>
            ) : null}
            {paletteState === "ready" ? (
              <ul className="mt-4 space-y-2">
                {palette.map((source) => (
                  <li key={`${source.sourceType}-${source.sourceId}-${source.sourceName}`} className="rounded-xl border border-zinc-200 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{source.sourceType}</p>
                    <p className="text-sm font-medium text-zinc-900">{source.sourceName}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
