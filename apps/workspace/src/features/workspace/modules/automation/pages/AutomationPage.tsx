import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Bot, FolderKanban, Loader2, Plus, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../ui/components/PageHeader";
import { formatDate } from "../../../model/formatters";
import { activateAgent, createAgentProject, getAgentProjects, getAgents, restoreAgent } from "../api";
import { CreateAgentSheet, CreateProjectSheet } from "../components";
import { LOAD_AUTOMATION_ERROR_TITLE } from "../model/constants";
import { toAutomationErrorMessage } from "../model/mappers";
import { getStatusBadgeClass } from "../model/statusBadge";
import type { AgentProject, AutomationAgent, AutomationPageStatus } from "../model/types";

type AutomationTab = "agents" | "projects";

function resolveTab(tab: string | null): AutomationTab {
  return tab === "projects" ? "projects" : "agents";
}

export function AutomationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get("tab"));

  const [createAgentSheetOpen, setCreateAgentSheetOpen] = useState(false);
  const [agents, setAgents] = useState<AutomationAgent[]>([]);
  const [status, setStatus] = useState<AutomationPageStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cardActionLoadingById, setCardActionLoadingById] = useState<Record<string, boolean>>({});
  const [cardActionErrorById, setCardActionErrorById] = useState<Record<string, string>>({});

  const [createProjectSheetOpen, setCreateProjectSheetOpen] = useState(false);
  const [projects, setProjects] = useState<AgentProject[]>([]);
  const [projectsStatus, setProjectsStatus] = useState<AutomationPageStatus>("idle");
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setProjectsStatus("loading");
    setProjectsError(null);
    try {
      const response = await getAgentProjects(0, 20);
      setProjects(response.items);
      setProjectsStatus("ready");
    } catch (loadError) {
      setProjectsError(toAutomationErrorMessage(loadError));
      setProjectsStatus("error");
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const response = await getAgents();
      setAgents(response);
      setStatus("ready");
    } catch (loadError) {
      setError(toAutomationErrorMessage(loadError));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "agents") {
      return;
    }
    void loadAgents();
  }, [activeTab, loadAgents]);

  useEffect(() => {
    if (activeTab !== "projects") {
      return;
    }
    void loadProjects();
  }, [activeTab, loadProjects]);

  const handleTabSwitch = useCallback((tab: AutomationTab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleCreated = useCallback((createdAgent: AutomationAgent) => {
    setAgents((currentAgents) => [createdAgent, ...currentAgents]);
    setCreateAgentSheetOpen(false);
    setStatus("ready");
    setError(null);
  }, []);

  const handleProjectCreated = useCallback((createdProject: AgentProject) => {
    setProjects((currentProjects) => [createdProject, ...currentProjects.filter((project) => project.id !== createdProject.id)]);
    setCreateProjectSheetOpen(false);
    setProjectsStatus("ready");
    setProjectsError(null);
  }, []);

  const handleCardClick = useCallback((agentId: string) => {
    navigate(`/automation/agents/${agentId}`);
  }, [navigate]);

  const handleProjectCardClick = useCallback((projectId: string) => {
    navigate(`/automation/projects/${projectId}`);
  }, [navigate]);

  const handleCardKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, agentId: string) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    handleCardClick(agentId);
  }, [handleCardClick]);

  const handleProjectCardKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, projectId: string) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    handleProjectCardClick(projectId);
  }, [handleProjectCardClick]);

  const handleCardCtaClick = useCallback(async (event: MouseEvent<HTMLButtonElement>, agent: AutomationAgent) => {
    event.stopPropagation();
    setCardActionErrorById((current) => ({ ...current, [agent.id]: "" }));

    if (agent.status === "ACTIVE") {
      navigate(`/automation/agents/${agent.id}/chat`);
      return;
    }

    if (agent.status !== "DRAFT" && agent.status !== "ARCHIVED") {
      return;
    }

    setCardActionLoadingById((current) => ({ ...current, [agent.id]: true }));
    try {
      const updatedAgent = agent.status === "DRAFT"
        ? await activateAgent(agent.id)
        : await restoreAgent(agent.id);
      setAgents((currentAgents) => currentAgents.map((currentAgent) => (
        currentAgent.id === updatedAgent.id ? updatedAgent : currentAgent
      )));
    } catch (actionError) {
      setCardActionErrorById((current) => ({ ...current, [agent.id]: toAutomationErrorMessage(actionError) }));
    } finally {
      setCardActionLoadingById((current) => ({ ...current, [agent.id]: false }));
    }
  }, [navigate]);

  const headerActionLabel = activeTab === "agents" ? "Create Agent" : "Create Project";

  const tabClass = useCallback((tab: AutomationTab) => {
    const common = "rounded-xl px-4 py-2 text-sm font-medium transition";
    return tab === activeTab
      ? `${common} bg-blue-600 text-white`
      : `${common} bg-zinc-100 text-zinc-700 hover:bg-zinc-200`;
  }, [activeTab]);

  const sortedProjects = useMemo(() => [...projects].sort((left, right) => (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )), [projects]);

  return (
    <>
      <PageHeader
        title="Automation"
        subtitle="Minimal Agent foundation for internal automation workflows."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => {
              if (activeTab === "agents") {
                setCreateAgentSheetOpen(true);
                return;
              }
              setCreateProjectSheetOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {headerActionLabel}
          </button>
        }
      />

      <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2">
        <button type="button" className={tabClass("agents")} onClick={() => handleTabSwitch("agents")}>Agents</button>
        <button type="button" className={tabClass("projects")} onClick={() => handleTabSwitch("projects")}>Projects</button>
      </div>

      {activeTab === "agents" && status === "loading" ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading agents...</span>
          </div>
        </div>
      ) : null}

      {activeTab === "agents" && status === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-lg font-semibold text-red-900">{LOAD_AUTOMATION_ERROR_TITLE}</h2>
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

      {activeTab === "agents" && status === "ready" && agents.length === 0 ? (
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
            onClick={() => setCreateAgentSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>
      ) : null}

      {activeTab === "agents" && status === "ready" && agents.length > 0 ? (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <article
              key={agent.id}
              role="button"
              tabIndex={0}
              className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-zinc-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => handleCardClick(agent.id)}
              onKeyDown={(event) => handleCardKeyDown(event, agent.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">{agent.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                    {agent.description ?? "No description yet."}
                  </p>
                </div>
                <div className="min-w-[160px] text-right text-xs text-zinc-500">
                  {agent.status === "ACTIVE" || agent.status === "DRAFT" || agent.status === "ARCHIVED" ? (
                    <button
                      type="button"
                      className="mb-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      disabled={Boolean(cardActionLoadingById[agent.id])}
                      onClick={(event) => void handleCardCtaClick(event, agent)}
                    >
                      {cardActionLoadingById[agent.id]
                        ? (agent.status === "DRAFT" ? "Activating..." : "Restoring...")
                        : (agent.status === "ACTIVE" ? "Chat" : (agent.status === "DRAFT" ? "Activate" : "Restore"))}
                    </button>
                  ) : null}
                  <div>Created {formatDate(agent.createdAt)}</div>
                  <div className="mt-2">Updated {formatDate(agent.updatedAt)}</div>
                </div>
              </div>
              {cardActionErrorById[agent.id] ? (
                <p className="mt-3 text-sm text-red-700">{cardActionErrorById[agent.id]}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "projects" && projectsStatus === "loading" ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading projects...</span>
          </div>
        </div>
      ) : null}

      {activeTab === "projects" && projectsStatus === "error" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-lg font-semibold text-red-900">Не вдалося завантажити Projects</h2>
          <p className="mt-2 text-sm text-red-700">{projectsError ?? "Unknown error"}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
            onClick={() => {
              setProjectsStatus("ready");
              setProjectsError(null);
              void loadProjects();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : null}

      {activeTab === "projects" && projectsStatus === "ready" && sortedProjects.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-zinc-900">No projects yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
            Create your first project to organize agent work.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => setCreateProjectSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : null}

      {activeTab === "projects" && projectsStatus === "ready" && sortedProjects.length > 0 ? (
        <div className="grid gap-4">
          {sortedProjects.map((project) => (
            <article
              key={project.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-zinc-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => handleProjectCardClick(project.id)}
              onKeyDown={(event) => handleProjectCardKeyDown(event, project.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">{project.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                    {project.description?.trim() ? project.description : "No description yet."}
                  </p>
                </div>
                <div className="min-w-[160px] text-right text-xs text-zinc-500">
                  <div>Created {formatDate(project.createdAt)}</div>
                  <div className="mt-2">Updated {formatDate(project.updatedAt)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <CreateAgentSheet
        open={createAgentSheetOpen}
        onClose={() => setCreateAgentSheetOpen(false)}
        onCreated={handleCreated}
      />

      <CreateProjectSheet
        open={createProjectSheetOpen}
        onClose={() => setCreateProjectSheetOpen(false)}
        onCreate={createAgentProject}
        onCreated={handleProjectCreated}
      />
    </>
  );
}
