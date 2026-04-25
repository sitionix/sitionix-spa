import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Check, Clock3, EllipsisVertical, Loader2, MessageSquareText, Pencil, Sparkles, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../ui/components/PageHeader";
import { ConfirmationDialog } from "../../../ui/components/ConfirmationDialog";
import { formatDateTime } from "../../../model/formatters";
import {
  acceptAgentRule,
  activateAgent,
  archiveAgent,
  createAgentRule,
  deleteAgent,
  deleteAgentRule,
  getAgentById,
  getAgentRules,
  getErrorHttpStatus,
  patchAgent,
  patchAgentRule,
  rejectAgentRule,
  restoreAgent,
} from "../api";
import { toAutomationErrorMessage } from "../model/mappers";
import type { AgentRule, AutomationAgent } from "../model/types";

type AgentOverviewState = "idle" | "loading" | "ready" | "not_found" | "error";
type EditableField = "name" | "description" | null;
type LifecycleAction = "activate" | "archive" | "restore" | "delete" | null;
type RuleAction = "create" | "active-save" | "active-delete" | "suggested-accept" | "suggested-reject" | "suggested-delete";

function getStatusBadgeClass(status: AutomationAgent["status"]): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "bg-zinc-100 text-zinc-600";
  }
  if (status === "DELETED") {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-700";
}

export function AgentOverviewPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<AutomationAgent | null>(null);
  const [status, setStatus] = useState<AgentOverviewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingField, setSavingField] = useState<EditableField>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [isInstructionEditing, setIsInstructionEditing] = useState(false);
  const [isInstructionSaving, setIsInstructionSaving] = useState(false);
  const [instructionSaveError, setInstructionSaveError] = useState<string | null>(null);
  const [lifecycleAction, setLifecycleAction] = useState<LifecycleAction>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRules, setActiveRules] = useState<AgentRule[]>([]);
  const [suggestedRules, setSuggestedRules] = useState<AgentRule[]>([]);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [ruleAction, setRuleAction] = useState<{ type: RuleAction; ruleId?: string } | null>(null);
  const [isCreateRuleEditing, setIsCreateRuleEditing] = useState(false);
  const [createRuleTitle, setCreateRuleTitle] = useState("");
  const [createRuleContent, setCreateRuleContent] = useState("");
  const [editingActiveRuleId, setEditingActiveRuleId] = useState<string | null>(null);
  const [activeRuleTitleDraft, setActiveRuleTitleDraft] = useState("");
  const [activeRuleContentDraft, setActiveRuleContentDraft] = useState("");
  const [openActiveRuleMenuId, setOpenActiveRuleMenuId] = useState<string | null>(null);
  const [editingSuggestedRuleId, setEditingSuggestedRuleId] = useState<string | null>(null);
  const [suggestedRuleTitleDraft, setSuggestedRuleTitleDraft] = useState("");
  const [suggestedRuleContentDraft, setSuggestedRuleContentDraft] = useState("");
  const [ruleDeleteConfirmOpen, setRuleDeleteConfirmOpen] = useState(false);
  const [ruleDeleteTargetId, setRuleDeleteTargetId] = useState<string | null>(null);

  const nameEditorRef = useRef<HTMLDivElement | null>(null);
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);

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

  const loadRules = useCallback(async () => {
    if (!agentId) {
      setActiveRules([]);
      setSuggestedRules([]);
      setRulesError(null);
      return;
    }
    try {
      const [active, suggested] = await Promise.all([
        getAgentRules(agentId, { status: "ACTIVE" }),
        getAgentRules(agentId, { status: "PENDING", authorType: "AI" }),
      ]);
      setActiveRules(active);
      setSuggestedRules(suggested);
      setRulesError(null);
    } catch (loadRulesError) {
      setRulesError(toAutomationErrorMessage(loadRulesError));
    }
  }, [agentId]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const startEditing = useCallback((field: Exclude<EditableField, null>) => {
    if (!agent) {
      return;
    }
    if (savingField || lifecycleAction) {
      return;
    }
    if (editingField && editingField !== field) {
      return;
    }

    setSaveError(null);
    if (field === "name") {
      setNameDraft(agent.name);
    } else {
      setDescriptionDraft(agent.description ?? "");
    }
    setEditingField(field);
  }, [agent, editingField, lifecycleAction, savingField]);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setSavingField(null);
    setSaveError(null);
  }, []);

  const saveField = useCallback(async (field: Exclude<EditableField, null>) => {
    if (!agent || savingField) {
      return;
    }

    const isName = field === "name";
    const draftValue = isName ? nameDraft : descriptionDraft;
    const currentValue = isName ? agent.name : (agent.description ?? "");
    const normalizedDraft = draftValue.trim();

    if (normalizedDraft === currentValue) {
      setEditingField(null);
      setSaveError(null);
      return;
    }

    setSavingField(field);
    setSaveError(null);

    try {
      const updatedAgent = await patchAgent(agent.id, isName
        ? { name: normalizedDraft }
        : { description: normalizedDraft || null });
      setAgent(updatedAgent);
      setEditingField(null);
      setLifecycleError(null);
    } catch (saveFieldError) {
      setSaveError(toAutomationErrorMessage(saveFieldError));
    } finally {
      setSavingField(null);
    }
  }, [agent, descriptionDraft, nameDraft, savingField]);

  const executeLifecycleAction = useCallback(async (action: Exclude<LifecycleAction, null>) => {
    if (!agent || lifecycleAction || savingField) {
      return;
    }

    setLifecycleAction(action);
    setLifecycleError(null);
    setSaveError(null);

    try {
      let updatedAgent: AutomationAgent;
      switch (action) {
      case "activate":
        updatedAgent = await activateAgent(agent.id);
        break;
      case "archive":
        updatedAgent = await archiveAgent(agent.id);
        break;
      case "restore":
        updatedAgent = await restoreAgent(agent.id);
        break;
      case "delete":
        updatedAgent = await deleteAgent(agent.id);
        break;
      default:
        return;
      }

      if (action === "delete") {
        navigate("/automation");
        return;
      }

      setAgent(updatedAgent);
    } catch (lifecycleActionError) {
      setLifecycleError(toAutomationErrorMessage(lifecycleActionError));
    } finally {
      setLifecycleAction(null);
    }
  }, [agent, lifecycleAction, navigate, savingField]);

  const runLifecycleAction = useCallback((action: Exclude<LifecycleAction, null>) => {
    if (action === "delete") {
      setDeleteConfirmOpen(true);
      return;
    }
    executeLifecycleAction(action).catch(() => undefined);
  }, [executeLifecycleAction]);

  const confirmDeleteAction = useCallback(() => {
    setDeleteConfirmOpen(false);
    executeLifecycleAction("delete").catch(() => undefined);
  }, [executeLifecycleAction]);

  const startInstructionEditing = useCallback(() => {
    if (!agent || savingField || lifecycleAction || isInstructionSaving) {
      return;
    }
    setInstructionSaveError(null);
    setInstructionDraft(agent.instruction ?? "");
    setIsInstructionEditing(true);
  }, [agent, isInstructionSaving, lifecycleAction, savingField]);

  const cancelInstructionEditing = useCallback(() => {
    setIsInstructionEditing(false);
    setIsInstructionSaving(false);
    setInstructionSaveError(null);
    setInstructionDraft(agent?.instruction ?? "");
  }, [agent]);

  const saveInstruction = useCallback(async () => {
    if (!agent || isInstructionSaving) {
      return;
    }

    const normalizedDraft = instructionDraft.trim();
    const currentValue = (agent.instruction ?? "").trim();

    if (normalizedDraft === currentValue) {
      setIsInstructionEditing(false);
      setInstructionSaveError(null);
      return;
    }

    setIsInstructionSaving(true);
    setInstructionSaveError(null);
    setSaveError(null);

    try {
      const updatedAgent = await patchAgent(agent.id, { instruction: normalizedDraft });
      setAgent(updatedAgent);
      setIsInstructionEditing(false);
      setLifecycleError(null);
    } catch (instructionError) {
      setInstructionSaveError(toAutomationErrorMessage(instructionError));
    } finally {
      setIsInstructionSaving(false);
    }
  }, [agent, instructionDraft, isInstructionSaving]);

  const startCreateRule = useCallback(() => {
    setIsCreateRuleEditing(true);
    setCreateRuleTitle("");
    setCreateRuleContent("");
    setRulesError(null);
  }, []);

  const cancelCreateRule = useCallback(() => {
    setIsCreateRuleEditing(false);
    setCreateRuleTitle("");
    setCreateRuleContent("");
  }, []);

  const saveCreateRule = useCallback(async () => {
    if (!agent || !isCreateRuleEditing || ruleAction) {
      return;
    }
    setRuleAction({ type: "create" });
    setRulesError(null);
    try {
      const createdRule = await createAgentRule(agent.id, {
        title: createRuleTitle,
        content: createRuleContent,
      });
      setActiveRules((prev) => [...prev, createdRule]);
      setIsCreateRuleEditing(false);
      setCreateRuleTitle("");
      setCreateRuleContent("");
    } catch (createRuleError) {
      setRulesError(toAutomationErrorMessage(createRuleError));
    } finally {
      setRuleAction(null);
    }
  }, [agent, createRuleContent, createRuleTitle, isCreateRuleEditing, ruleAction]);

  const startEditActiveRule = useCallback((rule: AgentRule) => {
    setOpenActiveRuleMenuId(null);
    setEditingActiveRuleId(rule.id);
    setActiveRuleTitleDraft(rule.title);
    setActiveRuleContentDraft(rule.content);
    setRulesError(null);
  }, []);

  const cancelEditActiveRule = useCallback(() => {
    setEditingActiveRuleId(null);
    setActiveRuleTitleDraft("");
    setActiveRuleContentDraft("");
    setOpenActiveRuleMenuId(null);
  }, []);

  const saveActiveRuleEdit = useCallback(async (ruleId: string) => {
    if (!agent || ruleAction) {
      return;
    }
    setRuleAction({ type: "active-save", ruleId });
    setRulesError(null);
    try {
      const updated = await patchAgentRule(agent.id, ruleId, {
        title: activeRuleTitleDraft,
        content: activeRuleContentDraft,
      });
      setActiveRules((prev) => prev.map((rule) => (rule.id === ruleId ? updated : rule)));
      setEditingActiveRuleId(null);
      setOpenActiveRuleMenuId(null);
    } catch (updateError) {
      setRulesError(toAutomationErrorMessage(updateError));
    } finally {
      setRuleAction(null);
    }
  }, [activeRuleContentDraft, activeRuleTitleDraft, agent, ruleAction]);

  const requestRuleDelete = useCallback((ruleId: string) => {
    setOpenActiveRuleMenuId(null);
    setRuleDeleteTargetId(ruleId);
    setRuleDeleteConfirmOpen(true);
  }, []);

  const confirmRuleDelete = useCallback(async () => {
    if (!agent || !ruleDeleteTargetId) {
      return;
    }
    if (ruleAction
      && (ruleAction.type !== "suggested-delete" || ruleAction.ruleId !== ruleDeleteTargetId)) {
      return;
    }
    const targetId = ruleDeleteTargetId;
    setRuleDeleteConfirmOpen(false);
    const deleteType: RuleAction = ruleAction?.type === "suggested-delete" ? "suggested-delete" : "active-delete";
    setRuleAction({ type: deleteType, ruleId: targetId });
    setRulesError(null);
    try {
      await deleteAgentRule(agent.id, targetId);
      setActiveRules((prev) => prev.filter((rule) => rule.id !== targetId));
      setSuggestedRules((prev) => prev.filter((rule) => rule.id !== targetId));
      if (editingActiveRuleId === targetId) {
        setEditingActiveRuleId(null);
      }
      if (editingSuggestedRuleId === targetId) {
        setEditingSuggestedRuleId(null);
      }
    } catch (deleteRuleError) {
      setRulesError(toAutomationErrorMessage(deleteRuleError));
    } finally {
      setRuleDeleteTargetId(null);
      setRuleAction(null);
    }
  }, [agent, editingActiveRuleId, editingSuggestedRuleId, ruleAction, ruleDeleteTargetId]);

  const cancelRuleDelete = useCallback(() => {
    setRuleDeleteConfirmOpen(false);
    setRuleDeleteTargetId(null);
    if (ruleAction?.type === "suggested-delete") {
      setRuleAction(null);
    }
  }, [ruleAction]);

  const startEditSuggestedRule = useCallback((rule: AgentRule) => {
    setEditingSuggestedRuleId(rule.id);
    setSuggestedRuleTitleDraft(rule.title);
    setSuggestedRuleContentDraft(rule.content);
    setRulesError(null);
  }, []);

  const cancelEditSuggestedRule = useCallback(() => {
    setEditingSuggestedRuleId(null);
    setSuggestedRuleTitleDraft("");
    setSuggestedRuleContentDraft("");
  }, []);

  const acceptSuggestedRule = useCallback(async (rule: AgentRule) => {
    if (!agent || ruleAction) {
      return;
    }
    setRuleAction({ type: "suggested-accept", ruleId: rule.id });
    setRulesError(null);
    try {
      const shouldSendEdit = editingSuggestedRuleId === rule.id
        && (suggestedRuleTitleDraft.trim() !== rule.title || suggestedRuleContentDraft.trim() !== rule.content);
      const accepted = await acceptAgentRule(
        agent.id,
        rule.id,
        shouldSendEdit
          ? { title: suggestedRuleTitleDraft, content: suggestedRuleContentDraft }
          : undefined,
      );
      setSuggestedRules((prev) => prev.filter((item) => item.id !== rule.id));
      setActiveRules((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === accepted.id);
        if (existingIndex >= 0) {
          return prev.map((item) => (item.id === accepted.id ? accepted : item));
        }
        return [...prev, accepted];
      });
      if (editingSuggestedRuleId === rule.id) {
        setEditingSuggestedRuleId(null);
      }
    } catch (acceptError) {
      setRulesError(toAutomationErrorMessage(acceptError));
    } finally {
      setRuleAction(null);
    }
  }, [agent, editingSuggestedRuleId, ruleAction, suggestedRuleContentDraft, suggestedRuleTitleDraft]);

  const rejectSuggestedRule = useCallback(async (ruleId: string) => {
    if (!agent || ruleAction) {
      return;
    }
    setRuleAction({ type: "suggested-reject", ruleId });
    setRulesError(null);
    try {
      await rejectAgentRule(agent.id, ruleId);
      setSuggestedRules((prev) => prev.filter((rule) => rule.id !== ruleId));
      if (editingSuggestedRuleId === ruleId) {
        setEditingSuggestedRuleId(null);
      }
    } catch (rejectError) {
      setRulesError(toAutomationErrorMessage(rejectError));
    } finally {
      setRuleAction(null);
    }
  }, [agent, editingSuggestedRuleId, ruleAction]);

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

  const handleNameKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveField("name");
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }, [cancelEditing, saveField]);

  const handleDescriptionKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }, [cancelEditing]);

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

  const isNameEditing = editingField === "name";
  const isDescriptionEditing = editingField === "description";
  const statusBadgeClass = getStatusBadgeClass(agent.status);
  const canActivate = agent.status === "DRAFT";
  const canArchive = agent.status === "DRAFT" || agent.status === "ACTIVE";
  const canRestore = agent.status === "ARCHIVED";
  const canDelete = agent.status !== "DELETED";
  const canOpenChat = agent.status === "ACTIVE";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Agent Overview"
        subtitle="Main workspace home for this automation agent."
        actions={
          <>
            {canOpenChat ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                onClick={() => navigate(`/automation/agents/${agent.id}/chat`)}
              >
                <MessageSquareText className="h-4 w-4" />
                Chat
              </button>
            ) : null}
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
              {isNameEditing ? (
                <div ref={nameEditorRef} className="w-full max-w-2xl">
                  <input
                    ref={nameInputRef}
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    onKeyDown={handleNameKeyDown}
                    disabled={savingField === "name"}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-3xl font-semibold text-zinc-900 outline-none ring-blue-100 focus:ring"
                  />
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>Enter to save</span>
                    <span>•</span>
                    <span>Escape to cancel</span>
                    {savingField === "name" ? (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="group inline-flex items-center gap-2">
                  <button
                    type="button"
                    className="truncate text-left text-3xl font-semibold text-zinc-900"
                    onClick={() => startEditing("name")}
                    aria-label="Edit agent name"
                  >
                    {agent.name}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
                    onClick={() => startEditing("name")}
                    aria-label="Edit agent name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusBadgeClass}`}>
                {agent.status}
              </span>
            </div>

            {isDescriptionEditing ? (
              <div ref={descriptionEditorRef} className="mt-3 max-w-3xl">
                <textarea
                  ref={descriptionInputRef}
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  disabled={savingField === "description"}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 text-zinc-800 outline-none ring-blue-100 focus:ring"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={savingField === "description"}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => void saveField("description")}
                  >
                    {savingField === "description" ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={savingField === "description"}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                  <span className="text-xs text-zinc-500">Escape to cancel</span>
                </div>
              </div>
            ) : (
              <div className="group mt-3 inline-flex max-w-3xl items-start gap-2">
                <button
                  type="button"
                  className="text-left text-sm leading-6 text-zinc-600"
                  onClick={() => startEditing("description")}
                  aria-label="Edit agent description"
                >
                  {agent.description ?? "No description yet."}
                </button>
                <button
                  type="button"
                  className="mt-1 rounded-lg p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
                  onClick={() => startEditing("description")}
                  aria-label="Edit agent description"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}

            {saveError ? (
              <p className="mt-3 text-sm text-red-700">{saveError}</p>
            ) : null}
            {instructionSaveError ? (
              <p className="mt-3 text-sm text-red-700">{instructionSaveError}</p>
            ) : null}
            {lifecycleError ? (
              <p className="mt-3 text-sm text-red-700">{lifecycleError}</p>
            ) : null}
            {rulesError ? (
              <p className="mt-3 text-sm text-red-700">{rulesError}</p>
            ) : null}
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

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Agent Definition</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Define behavioral instruction used as the primary execution context for this agent.
                </p>
              </div>
              {!isInstructionEditing ? (
                <button
                  type="button"
                  onClick={startInstructionEditing}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  aria-label={agent.instruction ? "Edit agent instruction" : "Add agent instruction"}
                >
                  <Pencil className="h-4 w-4" />
                  {agent.instruction ? "Edit" : "Add instruction"}
                </button>
              ) : null}
            </div>

            {isInstructionEditing ? (
              <div className="mt-4">
                <textarea
                  value={instructionDraft}
                  onChange={(event) => setInstructionDraft(event.target.value)}
                  disabled={isInstructionSaving}
                  rows={6}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 text-zinc-800 outline-none ring-blue-100 focus:ring"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isInstructionSaving}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => void saveInstruction()}
                  >
                    {isInstructionSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={isInstructionSaving}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    onClick={cancelInstructionEditing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                {agent.instruction ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{agent.instruction}</p>
                ) : (
                  <div className="text-sm text-zinc-600">
                    <p>No instruction defined yet.</p>
                    <p className="mt-2">Add instruction to define how this agent should behave.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Rules</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Active rules are used during execution.
                </p>
              </div>
              {!isCreateRuleEditing ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  onClick={startCreateRule}
                  disabled={Boolean(ruleAction)}
                >
                  + Add rule
                </button>
              ) : null}
            </div>

            {isCreateRuleEditing ? (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <input
                  value={createRuleTitle}
                  onChange={(event) => setCreateRuleTitle(event.target.value)}
                  placeholder="Rule title"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                />
                <textarea
                  value={createRuleContent}
                  onChange={(event) => setCreateRuleContent(event.target.value)}
                  placeholder="Rule content"
                  rows={4}
                  className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => void saveCreateRule()}
                    disabled={Boolean(ruleAction)}
                  >
                    {ruleAction?.type === "create" ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    onClick={cancelCreateRule}
                    disabled={Boolean(ruleAction)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 border-t border-zinc-300" />
            {activeRules.length === 0 ? (
              <div className="py-3 text-sm text-zinc-600">No active rules yet.</div>
            ) : (
              <ul className="space-y-2 py-2">
                {activeRules.map((rule) => {
                  const isEditing = editingActiveRuleId === rule.id;
                  const isSaving = ruleAction?.type === "active-save" && ruleAction.ruleId === rule.id;
                  const isDeleting = ruleAction?.type === "active-delete" && ruleAction.ruleId === rule.id;
                  const isMenuOpen = openActiveRuleMenuId === rule.id;
                  return (
                    <li
                      key={rule.id}
                      className="rounded-lg bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100 focus-within:bg-zinc-100"
                    >
                      {isEditing ? (
                        <>
                          <input
                            value={activeRuleTitleDraft}
                            onChange={(event) => setActiveRuleTitleDraft(event.target.value)}
                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                          />
                          <textarea
                            value={activeRuleContentDraft}
                            onChange={(event) => setActiveRuleContentDraft(event.target.value)}
                            rows={4}
                            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                              onClick={() => void saveActiveRuleEdit(rule.id)}
                              disabled={Boolean(ruleAction)}
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                              onClick={cancelEditActiveRule}
                              disabled={Boolean(ruleAction)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="relative flex items-center justify-between gap-3">
                          <p className="min-w-0 flex-1 overflow-hidden text-sm leading-5 text-zinc-800 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                            {rule.content}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${
                                rule.authorType === "AI"
                                  ? "border-blue-200 text-blue-600"
                                  : "border-zinc-300 text-zinc-600"
                              }`}
                            >
                              {rule.authorType}
                            </span>
                            <div className="relative shrink-0">
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                              onClick={() => setOpenActiveRuleMenuId((prev) => (prev === rule.id ? null : rule.id))}
                              disabled={Boolean(ruleAction)}
                              aria-label="Open active rule menu"
                            >
                              <EllipsisVertical className="h-4 w-4" />
                            </button>
                              {isMenuOpen ? (
                              <>
                                <button
                                  type="button"
                                  aria-label="Close active rule menu"
                                  className="fixed inset-0 z-10 bg-transparent"
                                  onClick={() => setOpenActiveRuleMenuId(null)}
                                />
                                  <div className="absolute right-0 top-8 z-20 min-w-24 rounded-md bg-white py-1">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
                                    onClick={() => startEditActiveRule(rule)}
                                  >
                                    Edit
                                  </button>
                                    <button
                                    type="button"
                                    className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                                    onClick={() => requestRuleDelete(rule.id)}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </button>
                                  </div>
                              </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Suggested Rules</h2>
            {suggestedRules.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Sparkles className="h-4 w-4" />
                  No suggested rules
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {suggestedRules.map((rule) => {
                  const isEditing = editingSuggestedRuleId === rule.id;
                  const isAccepting = ruleAction?.type === "suggested-accept" && ruleAction.ruleId === rule.id;
                  const isRejecting = ruleAction?.type === "suggested-reject" && ruleAction.ruleId === rule.id;
                  const isDeleting = ruleAction?.type === "suggested-delete" && ruleAction.ruleId === rule.id;
                  return (
                    <article key={rule.id} className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-zinc-900">{rule.title}</h3>
                        <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-100"
                            onClick={() => startEditSuggestedRule(rule)}
                            disabled={Boolean(ruleAction)}
                            aria-label="Edit suggested rule"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-300 bg-white text-red-700 transition hover:bg-red-50"
                            onClick={() => {
                              setRuleAction({ type: "suggested-delete", ruleId: rule.id });
                              requestRuleDelete(rule.id);
                            }}
                            disabled={Boolean(ruleAction)}
                            aria-label="Delete suggested rule"
                          >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                          {rule.authorType}
                        </span>
                      </div>
                      {isEditing ? (
                        <>
                          <input
                            value={suggestedRuleTitleDraft}
                            onChange={(event) => setSuggestedRuleTitleDraft(event.target.value)}
                            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                          />
                          <textarea
                            value={suggestedRuleContentDraft}
                            onChange={(event) => setSuggestedRuleContentDraft(event.target.value)}
                            rows={4}
                            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-100 focus:ring"
                          />
                        </>
                      ) : (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{rule.content}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          onClick={() => void acceptSuggestedRule(rule)}
                          disabled={Boolean(ruleAction)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isAccepting ? "Accepting..." : "Accept"}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                          onClick={() => void rejectSuggestedRule(rule.id)}
                          disabled={Boolean(ruleAction)}
                        >
                          <X className="h-3.5 w-3.5" />
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </button>
                        {isEditing ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                            onClick={cancelEditSuggestedRule}
                            disabled={Boolean(ruleAction)}
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
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
            <h2 className="text-lg font-semibold text-zinc-900">Lifecycle actions</h2>
            {canActivate ? (
              <button
                type="button"
                disabled={lifecycleAction !== null || savingField !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
                onClick={() => runLifecycleAction("activate")}
              >
                {lifecycleAction === "activate" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : "Activate"}
              </button>
            ) : null}

            {canArchive ? (
              <button
                type="button"
                disabled={lifecycleAction !== null || savingField !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
                onClick={() => runLifecycleAction("archive")}
              >
                {lifecycleAction === "archive" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Archiving...
                  </>
                ) : "Archive"}
              </button>
            ) : null}

            {canRestore ? (
              <button
                type="button"
                disabled={lifecycleAction !== null || savingField !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
                onClick={() => runLifecycleAction("restore")}
              >
                {lifecycleAction === "restore" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : "Restore"}
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                disabled={lifecycleAction !== null || savingField !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
                onClick={() => runLifecycleAction("delete")}
              >
                {lifecycleAction === "delete" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : "Delete"}
              </button>
            ) : null}

            {!canActivate && !canArchive && !canRestore && !canDelete ? (
              <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                This agent has no available lifecycle actions in this version.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete agent?"
        description="The agent will be removed from normal automation views."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteAction}
      />
      <ConfirmationDialog
        open={ruleDeleteConfirmOpen}
        title="Delete suggested rule?"
        description="Are you sure you want to delete this suggested rule?"
        confirmLabel="Delete"
        tone="danger"
        onCancel={cancelRuleDelete}
        onConfirm={() => void confirmRuleDelete()}
      />
    </div>
  );
}
