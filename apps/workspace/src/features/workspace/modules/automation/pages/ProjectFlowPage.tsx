import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectFlow, getProjectFlowPalette } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AgentProjectFlowNode, AgentProjectFlowPaletteSource } from "../model/types";

type LoadStatus = "idle" | "loading" | "ready" | "error";

function resolveNodeLabel(node: AgentProjectFlowNode): string {
  const config = node.config;
  if (config && typeof config === "object") {
    const candidate = config.label ?? config.name ?? config.title;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  if (node.referenceId?.trim()) {
    return node.referenceId;
  }
  return node.id;
}

function isEmptyFlow(flowId: string | null | undefined, nodes: AgentProjectFlowNode[], edgesCount: number): boolean {
  return !flowId && nodes.length === 0 && edgesCount === 0;
}

export function ProjectFlowPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [flowStatus, setFlowStatus] = useState<LoadStatus>("idle");
  const [paletteStatus, setPaletteStatus] = useState<LoadStatus>("idle");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<AgentProjectFlowNode[]>([]);
  const [edgesCount, setEdgesCount] = useState(0);
  const [sources, setSources] = useState<AgentProjectFlowPaletteSource[]>([]);

  const loadData = useCallback(async () => {
    if (!projectId?.trim()) {
      setFlowStatus("error");
      setFlowError("Project id is missing.");
      setPaletteStatus("error");
      setPaletteError("Project id is missing.");
      return;
    }

    setFlowStatus("loading");
    setPaletteStatus("loading");
    setFlowError(null);
    setPaletteError(null);

    const flowPromise = getProjectFlow(projectId)
      .then((flow) => {
        setFlowId(flow.flowId ?? null);
        setNodes(Array.isArray(flow.nodes) ? flow.nodes : []);
        setEdgesCount(Array.isArray(flow.edges) ? flow.edges.length : 0);
        setFlowStatus("ready");
      })
      .catch((error) => {
        setFlowStatus("error");
        setFlowError(toAutomationErrorMessage(error));
      });

    const palettePromise = getProjectFlowPalette(projectId)
      .then((palette) => {
        setSources(Array.isArray(palette.sources) ? palette.sources : []);
        setPaletteStatus("ready");
      })
      .catch((error) => {
        setPaletteStatus("error");
        setPaletteError(toAutomationErrorMessage(error));
      });

    await Promise.allSettled([flowPromise, palettePromise]);
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const empty = isEmptyFlow(flowId, nodes, edgesCount);

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

      {flowStatus === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-semibold text-red-900">Unable to load flow</h1>
          <p className="mt-2 text-sm text-red-700">{flowError ?? "Unknown error"}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-zinc-900">Project Flow</h1>
              {flowStatus === "loading" ? (
                <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading flow...
                </span>
              ) : null}
            </div>

            {flowStatus === "ready" && empty ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                Flow is empty for this project.
              </div>
            ) : null}

            {flowStatus === "ready" && !empty ? (
              <>
                <div className="relative min-h-[440px] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50">
                  <div className="relative h-[800px] w-[1200px]">
                    {nodes.map((node) => (
                      <article
                        key={node.id}
                        className="absolute w-52 rounded-xl border border-zinc-300 bg-white p-3 shadow-sm"
                        style={{ left: node.position.x, top: node.position.y }}
                      >
                        <p className="text-sm font-semibold text-zinc-900">{resolveNodeLabel(node)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">{node.nodeType}</p>
                      </article>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-500">Nodes: {nodes.length} • Edges: {edgesCount}</p>
              </>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Palette</h2>
            {paletteStatus === "loading" ? (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading palette...
              </div>
            ) : null}
            {paletteStatus === "error" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {paletteError ?? "Unable to load palette"}
              </div>
            ) : null}
            {paletteStatus === "ready" ? (
              <div className="mt-4 space-y-3">
                {sources.map((source) => (
                  <div key={`${source.sourceType}-${source.sourceId}`} className="rounded-xl border border-zinc-200 p-3">
                    <p className="text-sm font-semibold text-zinc-900">{source.sourceName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">{source.sourceType}</p>
                  </div>
                ))}
                {sources.length === 0 ? <p className="text-sm text-zinc-500">Palette is empty.</p> : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </>
  );
}
