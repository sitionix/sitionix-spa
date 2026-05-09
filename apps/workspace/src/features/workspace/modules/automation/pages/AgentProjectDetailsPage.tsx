import { ArrowLeft, Check, Loader2, Pencil, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../../../ui/components/ConfirmationDialog";
import { PageHeader } from "../../../ui/components/PageHeader";
import { formatDate } from "../../../model/formatters";
import {
  addAgentToProject,
  createProjectConversation,
  deleteAgentProject,
  getAgentProject,
  getProjectConversations,
  getAgents,
  getErrorHttpStatus,
  listAgentProjectAgents,
  patchAgentProject,
  removeAgentFromProject,
} from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import { getStatusBadgeClass } from "../model/statusBadge";
import type { AgentProject, AutomationAgent, ProjectAgent, ProjectConversation } from "../model/types";

type AgentProjectDetailsPageState = "idle" | "loading" | "ready" | "not_found" | "error";
type LoadableStatus = "idle" | "loading" | "ready" | "error";
type EditableField = "name" | "description" | "context" | null;
type EditableNonNullField = Exclude<EditableField, null>;
type FieldKind = "input" | "textarea";

export function AgentProjectDetailsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<AgentProject | null>(null);
  const [status, setStatus] = useState<AgentProjectDetailsPageState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [savingField, setSavingField] = useState<EditableField>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([]);
  const [projectAgentsStatus, setProjectAgentsStatus] = useState<LoadableStatus>("idle");
  const [projectAgentsError, setProjectAgentsError] = useState<string | null>(null);
  const [addAgentsOpen, setAddAgentsOpen] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<AutomationAgent[]>([]);
  const [availableAgentsStatus, setAvailableAgentsStatus] = useState<LoadableStatus>("idle");
  const [availableAgentsError, setAvailableAgentsError] = useState<string | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isAddingAgents, setIsAddingAgents] = useState(false);
  const [addAgentsError, setAddAgentsError] = useState<string | null>(null);
  const [pendingRemoveAgent, setPendingRemoveAgent] = useState<ProjectAgent | null>(null);
  const [isRemovingAgent, setIsRemovingAgent] = useState(false);
  const [removeAgentError, setRemoveAgentError] = useState<string | null>(null);
  const [projectConversations, setProjectConversations] = useState<ProjectConversation[]>([]);
  const [projectConversationsStatus, setProjectConversationsStatus] = useState<LoadableStatus>("idle");
  const [projectConversationsError, setProjectConversationsError] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedConversationAgentIds, setSelectedConversationAgentIds] = useState<string[]>([]);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [createConversationError, setCreateConversationError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const contextInputRef = useRef<HTMLTextAreaElement | null>(null);
  const nameEditorRef = useRef<HTMLDivElement | null>(null);
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const contextEditorRef = useRef<HTMLDivElement | null>(null);

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

  const loadProjectAgents = useCallback(async () => {
    if (!projectId?.trim()) {
      setProjectAgents([]);
      setProjectAgentsStatus("ready");
      setProjectAgentsError(null);
      return;
    }
    setProjectAgentsStatus("loading");
    setProjectAgentsError(null);
    try {
      const items = await listAgentProjectAgents(projectId);
      setProjectAgents(items);
      setProjectAgentsStatus("ready");
    } catch (loadError) {
      setProjectAgentsStatus("error");
      setProjectAgentsError(toAutomationErrorMessage(loadError));
    }
  }, [projectId]);

  const loadProjectConversations = useCallback(async () => {
    if (!projectId?.trim()) {
      setProjectConversations([]);
      setProjectConversationsStatus("ready");
      setProjectConversationsError(null);
      return;
    }
    setProjectConversationsStatus("loading");
    setProjectConversationsError(null);
    try {
      const response = await getProjectConversations(projectId);
      setProjectConversations(response.items);
      setProjectConversationsStatus("ready");
    } catch (loadError) {
      setProjectConversationsStatus("error");
      setProjectConversationsError(toAutomationErrorMessage(loadError));
    }
  }, [projectId]);

  const loadAvailableAgents = useCallback(async () => {
    if (!projectId?.trim()) {
      setAvailableAgents([]);
      setAvailableAgentsStatus("ready");
      setAvailableAgentsError(null);
      return;
    }
    setAvailableAgentsStatus("loading");
    setAvailableAgentsError(null);
    try {
      const [agents, attachedAgents] = await Promise.all([
        getAgents(),
        listAgentProjectAgents(projectId),
      ]);
      const attachedIds = new Set(attachedAgents.map((agent) => agent.id));
      setProjectAgents(attachedAgents);
      setProjectAgentsStatus("ready");
      setAvailableAgents(agents.filter((agent) => !attachedIds.has(agent.id)));
      setAvailableAgentsStatus("ready");
    } catch (loadError) {
      setAvailableAgentsStatus("error");
      setAvailableAgentsError(toAutomationErrorMessage(loadError));
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    void loadProjectAgents();
    void loadProjectConversations();
  }, [loadProjectAgents, loadProjectConversations, status]);

  const startEditing = useCallback((field: EditableNonNullField) => {
    if (!project || savingField || isDeleting) {
      return;
    }
    if (editingField && editingField !== field) {
      return;
    }
    setSaveError(null);
    setLifecycleError(null);
    if (field === "name") {
      setNameDraft(project.name);
    } else if (field === "description") {
      setDescriptionDraft(project.description ?? "");
    } else {
      setContextDraft(project.context ?? "");
    }
    setEditingField(field);
  }, [editingField, isDeleting, project, savingField]);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setSavingField(null);
    setSaveError(null);
  }, []);

  const saveField = useCallback(async (field: EditableNonNullField) => {
    if (!project || savingField || isDeleting) {
      return;
    }

    const draftValue = field === "name"
      ? nameDraft
      : field === "description"
        ? descriptionDraft
        : contextDraft;
    const currentValue = field === "name"
      ? project.name
      : field === "description"
        ? (project.description ?? "")
        : (project.context ?? "");
    const normalizedDraft = draftValue.trim();

    if (normalizedDraft === currentValue) {
      setEditingField(null);
      setSaveError(null);
      return;
    }

    setSavingField(field);
    setSaveError(null);

    try {
      const payload = field === "name"
        ? { name: normalizedDraft }
        : field === "description"
          ? { description: normalizedDraft || null }
          : { context: normalizedDraft || null };
      const updatedProject = await patchAgentProject(project.id, payload);
      setProject(updatedProject);
      setEditingField(null);
      setLifecycleError(null);
    } catch (saveFieldError) {
      setSaveError(toAutomationErrorMessage(saveFieldError));
    } finally {
      setSavingField(null);
    }
  }, [contextDraft, descriptionDraft, isDeleting, nameDraft, project, savingField]);

  const confirmDeleteAction = useCallback(async () => {
    if (!project || isDeleting || savingField) {
      return;
    }
    setDeleteConfirmOpen(false);
    setIsDeleting(true);
    setLifecycleError(null);
    setSaveError(null);
    try {
      await deleteAgentProject(project.id);
      navigate("/automation?tab=projects");
    } catch (deleteError) {
      setLifecycleError(toAutomationErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, navigate, project, savingField]);

  const openAddAgents = useCallback(async () => {
    if (!projectId?.trim() || isAddingAgents) {
      return;
    }
    setAddAgentsOpen(true);
    setAddAgentsError(null);
    setSelectedAgentIds([]);
    await loadAvailableAgents();
  }, [isAddingAgents, loadAvailableAgents, projectId]);

  const toggleSelectedAgent = useCallback((agentId: string) => {
    setSelectedAgentIds((current) => (
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    ));
  }, []);

  const submitAddAgents = useCallback(async () => {
    if (!projectId?.trim() || isAddingAgents || selectedAgentIds.length === 0) {
      return;
    }
    setIsAddingAgents(true);
    setAddAgentsError(null);
    try {
      await Promise.all(selectedAgentIds.map((agentId) => addAgentToProject(projectId, { agentId })));
      await loadProjectAgents();
      setAddAgentsOpen(false);
      setAvailableAgents([]);
      setSelectedAgentIds([]);
    } catch (addError) {
      setAddAgentsError(toAutomationErrorMessage(addError));
      await loadAvailableAgents();
    } finally {
      setIsAddingAgents(false);
    }
  }, [isAddingAgents, loadAvailableAgents, loadProjectAgents, projectId, selectedAgentIds]);

  const confirmRemoveProjectAgent = useCallback(async () => {
    if (!projectId?.trim() || !pendingRemoveAgent || isRemovingAgent) {
      return;
    }
    setIsRemovingAgent(true);
    setRemoveAgentError(null);
    try {
      await removeAgentFromProject(projectId, pendingRemoveAgent.id);
      setPendingRemoveAgent(null);
      await loadProjectAgents();
    } catch (removeError) {
      setRemoveAgentError(toAutomationErrorMessage(removeError));
    } finally {
      setIsRemovingAgent(false);
    }
  }, [isRemovingAgent, loadProjectAgents, pendingRemoveAgent, projectId]);

  const submitCreateConversation = useCallback(async () => {
    if (!projectId?.trim() || isCreatingConversation || selectedConversationAgentIds.length === 0) {
      return;
    }
    setIsCreatingConversation(true);
    setCreateConversationError(null);
    try {
      const response = await createProjectConversation(projectId, selectedConversationAgentIds);
      setNewChatOpen(false);
      setSelectedConversationAgentIds([]);
      navigate(`/automation/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(response.id)}`);
      void loadProjectConversations();
    } catch (createError) {
      setCreateConversationError(toAutomationErrorMessage(createError));
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, loadProjectConversations, navigate, projectId, selectedConversationAgentIds]);

  useEffect(() => {
    const activeInput = editingField === "name"
      ? nameInputRef.current
      : editingField === "description"
        ? descriptionInputRef.current
      : editingField === "context"
        ? contextInputRef.current
        : null;
    if (!activeInput) {
      return;
    }
    activeInput.focus();
    activeInput.select();
  }, [editingField]);

  useEffect(() => {
    if (editingField !== "name") {
      return;
    }
    const onDocumentMouseDown = (event: MouseEvent) => {
      const currentEditor = nameEditorRef.current;
      if (!currentEditor) {
        return;
      }

      const targetNode = event.target;
      if (targetNode instanceof Node && currentEditor.contains(targetNode)) {
        return;
      }

      void saveField("name");
    };

    window.addEventListener("mousedown", onDocumentMouseDown);
    return () => window.removeEventListener("mousedown", onDocumentMouseDown);
  }, [editingField, saveField]);

  const handleFieldKeyDown = useCallback((field: EditableNonNullField, kind: FieldKind) => (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
      return;
    }
    if (field === "name" && kind === "input" && event.key === "Enter") {
      event.preventDefault();
      void saveField("name");
    }
  }, [cancelEditing, saveField]);

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

      <PageStateView
        status={status}
        error={error}
        onRetry={loadProject}
      />

      {status === "ready" && project ? (
        <>
          <PageHeader
            title="Project overview"
            subtitle="Workspace view, project context, and lifecycle controls for this automation project."
            actions={<span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(project.status)}`}>{project.status}</span>}
          />

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="min-w-0">
              <EditableField
                className="flex flex-wrap items-center gap-3"
                textClassName="truncate text-left text-3xl font-semibold text-zinc-900"
                ariaLabel="Edit project name"
                field="name"
                editingField={editingField}
                onStartEditing={startEditing}
                value={project.name}
                draftValue={nameDraft}
                disabled={savingField === "name"}
                inputRef={nameInputRef}
                editorRef={nameEditorRef}
                onDraftChange={setNameDraft}
                onSave={() => void saveField("name")}
                onCancel={cancelEditing}
                onKeyDown={handleFieldKeyDown("name", "input")}
                kind="input"
                editorClassName="w-full rounded-xl border border-zinc-300 px-4 py-2 text-3xl font-semibold text-zinc-900 outline-none ring-blue-100 focus:ring"
              />

              <EditableField
                className="mt-3 inline-flex max-w-3xl items-start gap-2"
                textClassName="whitespace-pre-wrap break-words text-left text-sm leading-6 text-zinc-600"
                ariaLabel="Edit project description"
                field="description"
                editingField={editingField}
                onStartEditing={startEditing}
                value={project.description ?? "No description yet."}
                draftValue={descriptionDraft}
                disabled={savingField === "description"}
                isSaving={savingField === "description"}
                inputRef={descriptionInputRef}
                editorRef={descriptionEditorRef}
                onDraftChange={setDescriptionDraft}
                onSave={() => void saveField("description")}
                onCancel={cancelEditing}
                onKeyDown={handleFieldKeyDown("description", "textarea")}
                kind="textarea"
                editorClassName="w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 text-zinc-800 outline-none ring-blue-100 focus:ring"
              />

              <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                <div>Created {formatDate(project.createdAt)}</div>
                <div>Updated {formatDate(project.updatedAt)}</div>
              </div>

              <InlineError message={saveError} />
              <InlineError message={lifecycleError} />
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Project context</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Describe what agents should know when working inside this project.
                </p>
              </div>
              {editingField !== "context" ? (
                <button
                  type="button"
                  onClick={() => startEditing("context")}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  aria-label="Edit project context"
                >
                  <Pencil className="h-4 w-4" />
                  {project.context?.trim() ? "Edit" : "Add context"}
                </button>
              ) : null}
            </div>

            {editingField === "context" ? (
              <div ref={contextEditorRef} className="mt-4">
                <textarea
                  ref={contextInputRef}
                  value={contextDraft}
                  onChange={(event) => setContextDraft(event.target.value)}
                  onKeyDown={handleFieldKeyDown("context", "textarea")}
                  disabled={savingField === "context"}
                  rows={6}
                  maxLength={5000}
                  className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 text-zinc-800 outline-none ring-blue-100 focus:ring"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={savingField === "context"}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => void saveField("context")}
                  >
                    {savingField === "context" ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={savingField === "context"}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {project.context?.trim() ? project.context : "No context yet."}
                </p>
              </div>
            )}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="grid gap-4">
              <ProjectAgentsSection
                agents={projectAgents}
                status={projectAgentsStatus}
                error={projectAgentsError}
                removeError={removeAgentError}
                onRetry={() => void loadProjectAgents()}
                onOpenAddAgents={() => void openAddAgents()}
                onRemoveAgent={(agent) => {
                  setRemoveAgentError(null);
                  setPendingRemoveAgent(agent);
                }}
              />
              <ProjectConversationsSection
                conversations={projectConversations}
                attachedAgents={projectAgents}
                status={projectConversationsStatus}
                error={projectConversationsError}
                onRetry={() => void loadProjectConversations()}
                onOpenNewChat={() => {
                  setCreateConversationError(null);
                  setSelectedConversationAgentIds([]);
                  setNewChatOpen(true);
                }}
                onOpenConversation={(conversationId) => {
                  navigate(`/automation/projects/${encodeURIComponent(projectId ?? "")}/conversations/${encodeURIComponent(conversationId)}`);
                }}
              />
            </div>

            <aside>
              <LifecycleActions
                isDeleting={isDeleting}
                isDisabled={savingField !== null}
                onDelete={() => setDeleteConfirmOpen(true)}
              />
            </aside>
          </div>
        </>
      ) : null}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete project?"
        description="The project will be removed from normal automation views."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void confirmDeleteAction()}
      />
      <AddProjectAgentsSheet
        open={addAgentsOpen}
        agents={availableAgents}
        status={availableAgentsStatus}
        error={availableAgentsError}
        addError={addAgentsError}
        selectedAgentIds={selectedAgentIds}
        isSubmitting={isAddingAgents}
        onClose={() => {
          if (isAddingAgents) {
            return;
          }
          setAddAgentsOpen(false);
          setSelectedAgentIds([]);
          setAddAgentsError(null);
        }}
        onToggleSelected={toggleSelectedAgent}
        onSubmit={() => void submitAddAgents()}
      />
      <NewProjectChatSheet
        open={newChatOpen}
        agents={projectAgents}
        selectedAgentIds={selectedConversationAgentIds}
        isSubmitting={isCreatingConversation}
        error={createConversationError}
        onClose={() => {
          if (isCreatingConversation) {
            return;
          }
          setNewChatOpen(false);
          setSelectedConversationAgentIds([]);
          setCreateConversationError(null);
        }}
        onToggleSelected={(agentId) => {
          setSelectedConversationAgentIds((current) => (
            current.includes(agentId) ? current.filter((id) => id !== agentId) : [...current, agentId]
          ));
        }}
        onSubmit={() => void submitCreateConversation()}
      />
      <ConfirmationDialog
        open={pendingRemoveAgent !== null}
        title="Remove agent from project?"
        description="This will only remove the agent from this project. The agent itself will not be deleted."
        confirmLabel={isRemovingAgent ? "Removing..." : "Remove"}
        tone="danger"
        onCancel={() => {
          if (isRemovingAgent) {
            return;
          }
          setPendingRemoveAgent(null);
        }}
        onConfirm={() => void confirmRemoveProjectAgent()}
      />
    </>
  );
}

type PageStateViewProps = {
  status: AgentProjectDetailsPageState;
  error: string | null;
  onRetry: () => Promise<void>;
};

function PageStateView({ status, error, onRetry }: PageStateViewProps) {
  if (status === "loading") {
    return (
      <StatePanel>
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading project details...</span>
        </div>
      </StatePanel>
    );
  }

  if (status === "not_found") {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Project not found</h2>
        <p className="mt-2 text-sm text-zinc-600">This project may have been deleted or you may not have access to it.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-lg font-semibold text-red-900">Unable to load project details</h2>
        <p className="mt-2 text-sm text-red-700">{error ?? "Unknown error"}</p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
          onClick={() => void onRetry()}
        >
          <RefreshCw className="h-4 w-4" />Retry
        </button>
      </div>
    );
  }

  return null;
}

function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
      {children}
    </div>
  );
}

type EditableDescriptionProps = {
  className: string;
  textClassName: string;
  ariaLabel: string;
  value: string;
  field: EditableNonNullField;
  editingField: EditableField;
  draftValue: string;
  disabled: boolean;
  isSaving?: boolean;
  kind: FieldKind;
  editorClassName: string;
  textareaMaxLength?: number;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onStartEditing: (field: EditableNonNullField) => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

function InlineError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <p className="mt-3 text-sm text-red-700">{message}</p>;
}

type ProjectAgentsSectionProps = {
  agents: ProjectAgent[];
  status: LoadableStatus;
  error: string | null;
  removeError: string | null;
  onRetry: () => void;
  onOpenAddAgents: () => void;
  onRemoveAgent: (agent: ProjectAgent) => void;
};

function ProjectAgentsSection({
  agents,
  status,
  error,
  removeError,
  onRetry,
  onOpenAddAgents,
  onRemoveAgent,
}: ProjectAgentsSectionProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Agents</h2>
        <button
          type="button"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          onClick={onOpenAddAgents}
        >
          Add Agents
        </button>
      </div>
      <p className="mt-2 text-sm text-zinc-600">Agents attached to this project will be available for future project conversations.</p>
      <InlineError message={removeError} />
      {status === "loading" ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading agents...
        </div>
      ) : null}
      {status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error ?? "Unable to load attached agents."}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>Retry</button>
        </div>
      ) : null}
      {status === "ready" && agents.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4">
          <p className="text-sm font-medium text-zinc-900">No agents attached yet</p>
          <p className="mt-1 text-sm text-zinc-600">Add agents to prepare this project for future conversations.</p>
        </div>
      ) : null}
      {status === "ready" && agents.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{agent.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{agent.description?.trim() ? agent.description : "No description yet."}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>{agent.status}</span>
                  <button type="button" className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-red-700" aria-label={`Remove ${agent.name}`} onClick={() => onRemoveAgent(agent)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

type AddProjectAgentsSheetProps = {
  open: boolean;
  agents: AutomationAgent[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  addError: string | null;
  selectedAgentIds: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onToggleSelected: (agentId: string) => void;
  onSubmit: () => void;
};

function AddProjectAgentsSheet({
  open,
  agents,
  status,
  error,
  addError,
  selectedAgentIds,
  isSubmitting,
  onClose,
  onToggleSelected,
  onSubmit,
}: AddProjectAgentsSheetProps) {
  if (!open) {
    return null;
  }
  return (
    <>
      <button type="button" aria-label="Close add agents sheet" className="fixed inset-0 z-50 bg-black/35" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-[560px] border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Add Agents</h2>
            <button type="button" aria-label="Close" className="h-10 w-10 rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700" onClick={onClose}>
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-zinc-600">Select one or more agents to attach to this project.</p>
          <InlineError message={addError} />
          {status === "loading" ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Loading available agents...</div>
          ) : null}
          {status === "error" ? (
            <p className="mt-5 text-sm text-red-700">{error ?? "Unable to load available agents."}</p>
          ) : null}
          {status === "ready" && agents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-4">
              <p className="text-sm font-medium text-zinc-900">No available agents</p>
              <p className="mt-1 text-sm text-zinc-600">All your agents are already attached to this project, or you have not created agents yet.</p>
            </div>
          ) : null}
          {status === "ready" && agents.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {agents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.id);
                return (
                  <button
                    type="button"
                    key={agent.id}
                    className={`agent-card rounded-2xl border p-4 text-left transition ${isSelected ? "agent-card--selected border-emerald-500 bg-emerald-50/60" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                    onClick={() => onToggleSelected(agent.id)}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{agent.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">{agent.description?.trim() ? agent.description : "No description yet."}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>{agent.status}</span>
                        {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
            <button type="button" className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" onClick={onClose}>
              Cancel
            </button>
            <button type="button" disabled={isSubmitting || selectedAgentIds.length === 0} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={onSubmit}>
              {isSubmitting ? "Adding selected agents..." : "Add selected agents"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

type ProjectConversationsSectionProps = Readonly<{
  conversations: ProjectConversation[];
  attachedAgents: ProjectAgent[];
  status: LoadableStatus;
  error: string | null;
  onRetry: () => void;
  onOpenNewChat: () => void;
  onOpenConversation: (conversationId: string) => void;
}>;

function ProjectConversationsSection({
  conversations,
  attachedAgents,
  status,
  error,
  onRetry,
  onOpenNewChat,
  onOpenConversation,
}: ProjectConversationsSectionProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Conversations</h2>
        <button type="button" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" onClick={onOpenNewChat}>
          New Chat
        </button>
      </div>
      {status === "loading" ? <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Loading conversations...</div> : null}
      {status === "error" ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{error ?? "Unable to load conversations."}</p><button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>Retry</button></div> : null}
      {status === "ready" && conversations.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4">
          <p className="text-sm font-medium text-zinc-900">No conversations yet.</p>
          <p className="mt-1 text-sm text-zinc-600">Create a project chat with one or more attached agents.</p>
        </div>
      ) : null}
      {status === "ready" && conversations.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {conversations.map((conversation) => {
            const agentNames = conversation.participants.filter((participant) => participant.type === "AGENT").map((participant) => participant.name);
            return (
              <button key={conversation.id} type="button" className="rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300" onClick={() => onOpenConversation(conversation.id)}>
                <p className="text-sm font-semibold text-zinc-900">{conversation.title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{conversation.type}</p>
                <p className="mt-2 text-sm text-zinc-600">{agentNames.join(", ") || "No agents"}</p>
                <p className="mt-2 text-xs text-zinc-500">Created {formatDate(conversation.createdAt)}</p>
              </button>
            );
          })}
        </div>
      ) : null}
      {status === "ready" && attachedAgents.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No agents attached yet. Attach agents to this project before creating a chat.</p>
      ) : null}
    </section>
  );
}

type NewProjectChatSheetProps = Readonly<{
  open: boolean;
  agents: ProjectAgent[];
  selectedAgentIds: string[];
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onToggleSelected: (agentId: string) => void;
  onSubmit: () => void;
}>;

function NewProjectChatSheet({ open, agents, selectedAgentIds, isSubmitting, error, onClose, onToggleSelected, onSubmit }: NewProjectChatSheetProps) {
  if (!open) {
    return null;
  }
  return (
    <>
      <button type="button" aria-label="Close new chat sheet" className="fixed inset-0 z-50 bg-black/35" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-[560px] border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">New project chat</h2>
            <button type="button" aria-label="Close" className="h-10 w-10 rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700" onClick={onClose}><X className="mx-auto h-5 w-5" /></button>
          </div>
          <p className="mt-2 text-sm text-zinc-600">Select agents for this conversation. Only agents attached to this project are available.</p>
          <InlineError message={error} />
          {agents.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-4"><p className="text-sm font-medium text-zinc-900">No agents attached yet.</p><p className="mt-1 text-sm text-zinc-600">Attach agents to this project before creating a chat.</p></div> : null}
          {agents.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {agents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.id);
                return (
                  <button key={agent.id} type="button" className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-emerald-500 bg-emerald-50/60" : "border-zinc-200 bg-white hover:border-zinc-300"}`} aria-pressed={isSelected} onClick={() => onToggleSelected(agent.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-zinc-900">{agent.name}</p><p className="mt-1 text-sm text-zinc-600">{agent.description?.trim() ? agent.description : "No description yet."}</p></div>
                      <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(agent.status)}`}>{agent.status}</span>{isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
            <button type="button" className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" onClick={onClose}>Cancel</button>
            <button type="button" disabled={isSubmitting || selectedAgentIds.length === 0} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={onSubmit}>
              {isSubmitting ? "Creating chat..." : "Create chat"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

type LifecycleActionsProps = {
  isDeleting: boolean;
  isDisabled: boolean;
  onDelete: () => void;
};

function LifecycleActions({ isDeleting, isDisabled, onDelete }: LifecycleActionsProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Lifecycle actions</h2>
      <button
        type="button"
        disabled
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed disabled:opacity-100"
        title="Coming soon"
      >
        Archive
      </button>
      <button
        type="button"
        disabled={isDeleting || isDisabled}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
        onClick={onDelete}
      >
        {isDeleting ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</>
        ) : "Delete"}
      </button>
    </section>
  );
}

function EditableField({
  className,
  textClassName,
  ariaLabel,
  value,
  field,
  editingField,
  draftValue,
  disabled,
  isSaving = false,
  kind,
  editorClassName,
  textareaMaxLength,
  inputRef,
  editorRef,
  onStartEditing,
  onDraftChange,
  onSave,
  onCancel,
  onKeyDown,
}: EditableDescriptionProps) {
  const onInputKeyDown = onKeyDown as (event: KeyboardEvent<HTMLInputElement>) => void;
  const onTextareaKeyDown = onKeyDown as (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  const textInputRef = inputRef as React.RefObject<HTMLInputElement>;
  const textAreaRef = inputRef as React.RefObject<HTMLTextAreaElement>;

  if (editingField === field) {
    return (
      <div ref={editorRef} className={field === "name" ? "w-full max-w-2xl" : "max-w-3xl"}>
        {kind === "input" ? (
          <input
            ref={textInputRef}
            value={draftValue}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            disabled={disabled}
            className={editorClassName}
          />
        ) : (
          <textarea
            ref={textAreaRef}
            value={draftValue}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onTextareaKeyDown}
            disabled={disabled}
            maxLength={textareaMaxLength}
            rows={3}
            className={editorClassName}
          />
        )}
        {kind === "textarea" ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              onClick={onSave}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`group ${className}`}>
      <button
        type="button"
        className={textClassName}
        onClick={() => onStartEditing(field)}
        aria-label={ariaLabel}
      >
        {value}
      </button>
      <button
        type="button"
        className="rounded-lg p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
        onClick={() => onStartEditing(field)}
        aria-label={ariaLabel}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
