import { ArrowLeft, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../../../ui/components/ConfirmationDialog";
import { PageHeader } from "../../../ui/components/PageHeader";
import { formatDate } from "../../../model/formatters";
import { deleteAgentProject, getAgentProject, getErrorHttpStatus, patchAgentProject } from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import { getStatusBadgeClass } from "../model/statusBadge";
import type { AgentProject } from "../model/types";

type AgentProjectDetailsPageState = "idle" | "loading" | "ready" | "not_found" | "error";
type EditableField = "name" | "description" | null;
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
  const [savingField, setSavingField] = useState<EditableField>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const nameEditorRef = useRef<HTMLDivElement | null>(null);
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);

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
    } else {
      setDescriptionDraft(project.description ?? "");
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

    const isName = field === "name";
    const draftValue = isName ? nameDraft : descriptionDraft;
    const currentValue = isName ? project.name : (project.description ?? "");
    const normalizedDraft = draftValue.trim();

    if (normalizedDraft === currentValue) {
      setEditingField(null);
      setSaveError(null);
      return;
    }

    setSavingField(field);
    setSaveError(null);

    try {
      const updatedProject = await patchAgentProject(project.id, isName
        ? { name: normalizedDraft }
        : { description: normalizedDraft || null });
      setProject(updatedProject);
      setEditingField(null);
      setLifecycleError(null);
    } catch (saveFieldError) {
      setSaveError(toAutomationErrorMessage(saveFieldError));
    } finally {
      setSavingField(null);
    }
  }, [descriptionDraft, isDeleting, nameDraft, project, savingField]);

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

  useEffect(() => {
    if (editingField === "name") {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
      return;
    }
    if (editingField === "description") {
      descriptionInputRef.current?.focus();
      descriptionInputRef.current?.select();
    }
  }, [editingField]);

  useEffect(() => {
    if (!editingField) {
      return;
    }

    const handleOutsideMouseDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const editor = editingField === "name" ? nameEditorRef.current : descriptionEditorRef.current;
      if (!editor || editor.contains(targetNode)) {
        return;
      }
      void saveField(editingField);
    };

    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideMouseDown);
    };
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
            subtitle="Workspace view and lifecycle controls for this automation project."
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
                textClassName="text-left text-sm leading-6 text-zinc-600"
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

          <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="grid gap-4">
              <PlaceholderCard
                title="Agents"
                description="Project agents will appear here."
                note="Soon you will be able to attach agents to this project."
              />
              <PlaceholderCard
                title="Conversations"
                description="Project conversations will appear here."
                note="Soon you will be able to start project-bound conversations."
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

type PlaceholderCardProps = {
  title: string;
  description: string;
  note: string;
};

function PlaceholderCard({ title, description, note }: PlaceholderCardProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      <p className="mt-1 text-sm text-zinc-500">{note}</p>
    </section>
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
  inputRef,
  editorRef,
  onStartEditing,
  onDraftChange,
  onSave,
  onCancel,
  onKeyDown,
}: EditableDescriptionProps) {
  if (editingField === field) {
    return (
      <div ref={editorRef} className={field === "name" ? "w-full max-w-2xl" : "max-w-3xl"}>
        {kind === "input" ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draftValue}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown as (event: KeyboardEvent<HTMLInputElement>) => void}
            disabled={disabled}
            className={editorClassName}
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftValue}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown as (event: KeyboardEvent<HTMLTextAreaElement>) => void}
            disabled={disabled}
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
