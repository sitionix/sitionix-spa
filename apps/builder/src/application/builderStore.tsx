import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  applyCommand,
  checkDependency,
  asSlug,
  normalizeCommand,
  normalizeSlug,
  validateCommand,
  validatePageName,
  validateSlug,
  validateUniqueSlug,
  type CommandResult,
  type Command,
  type DependencyCheck,
  type DependencyResult,
  type PageId,
  type PageMeta,
  type SiteState,
} from "../domain/pages";
import { createInitialDocument, type Breakpoint, type BuilderDocument } from "../domain/document";
import { loadDraft, saveDraft } from "./storage";
import {
  createEmptySiteState,
  createPageId,
  deriveUniqueSlugFromName,
} from "./siteState";

export type BuilderEditorState = {
  mode: "edit" | "preview";
  activeBreakpoint: Breakpoint;
  selectedNodeId: string | null;
};

type CreatePageModalState = {
  open: boolean;
  draftName: string;
  draftSlug: string;
  nameTouched: boolean;
  slugTouched: boolean;
  slugManuallyEdited: boolean;
  isHome: boolean;
};

type InlineRenameState = {
  pageId: PageId;
  draftName: string;
  nameTouched: boolean;
} | null;

type ConfirmDeleteState = {
  pageId: PageId;
} | null;

type InspectorDraftState = {
  pageId: PageId | null;
  draftName: string;
  draftSlug: string;
  nameTouched: boolean;
  slugTouched: boolean;
};

type FocusTarget = "inspector-name" | null;

export type BuilderUIState = {
  createPageModal: CreatePageModalState;
  inlineRename: InlineRenameState;
  confirmDelete: ConfirmDeleteState;
  inspector: InspectorDraftState;
  focusTarget: FocusTarget;
};

export type BuilderState = {
  siteId: string;
  site: SiteState;
  editor: BuilderEditorState;
  ui: BuilderUIState;
};

export type BuilderDerivedState = {
  hasPages: boolean;
  activePageId: PageId | null;
  activePage: PageMeta | null;
  activeDocument: BuilderDocument | null;
  createPage: {
    normalizedSlug: string;
    nameError: string | null;
    slugError: string | null;
    canSubmit: boolean;
  };
  inlineRename: {
    nameError: string | null;
    canSubmit: boolean;
  };
  inspector: {
    nameError: string | null;
    slugError: string | null;
    canCommitName: boolean;
    canCommitSlug: boolean;
  };
  dependency: (check: DependencyCheck) => DependencyResult;
};

type BuilderAction =
  | { type: "editor/setBreakpoint"; breakpoint: Breakpoint }
  | { type: "editor/toggleMode" }
  | { type: "ui/setCreatePageModal"; modal: CreatePageModalState }
  | { type: "ui/setInlineRename"; inlineRename: InlineRenameState }
  | { type: "ui/setConfirmDelete"; confirmDelete: ConfirmDeleteState }
  | { type: "ui/setInspector"; inspector: InspectorDraftState }
  | { type: "ui/setFocusTarget"; target: FocusTarget }
  | {
      type: "site/commit";
      site: SiteState;
      ui?: Partial<BuilderUIState>;
      editor?: Partial<BuilderEditorState>;
    };

const emptyCreatePageModal = (isHome: boolean): CreatePageModalState => ({
  open: false,
  draftName: "",
  draftSlug: isHome ? "/" : "",
  nameTouched: false,
  slugTouched: false,
  slugManuallyEdited: false,
  isHome,
});

const emptyInspectorDraft = (): InspectorDraftState => ({
  pageId: null,
  draftName: "",
  draftSlug: "",
  nameTouched: false,
  slugTouched: false,
});

const createInspectorDraft = (site: SiteState): InspectorDraftState => {
  if (!site.activePageId) return emptyInspectorDraft();
  const page = site.pages[site.activePageId];
  if (!page) return emptyInspectorDraft();
  return {
    pageId: site.activePageId,
    draftName: page.name,
    draftSlug: page.slug,
    nameTouched: false,
    slugTouched: false,
  };
};

const getConflictName = (site: SiteState, conflictId?: PageId) => {
  if (!conflictId) return null;
  return site.pages[conflictId]?.name ?? null;
};

const deriveSlugError = ({
  site,
  normalizedSlug,
  isHome,
  pageId,
}: {
  site: SiteState;
  normalizedSlug: string;
  isHome: boolean;
  pageId?: PageId;
}): string | null => {
  if (isHome) return null;
  const slugResult = validateSlug(normalizedSlug);
  if (!slugResult.ok) return slugResult.error.message;
  if (normalizedSlug === "/") return "Only the home page can use /.";
  const uniqueResult = validateUniqueSlug(site, normalizedSlug, pageId);
  if (!uniqueResult.ok) {
    const conflictName = getConflictName(site, uniqueResult.error.conflictId);
    return conflictName
      ? `Slug already used by ${conflictName}.`
      : uniqueResult.error.message;
  }
  return null;
};

const deriveCreatePageValidation = (
  site: SiteState,
  modal: CreatePageModalState
) => {
  const normalizedSlug = normalizeSlug(modal.draftSlug);
  const nameResult = validatePageName(modal.draftName);
  const slugError = deriveSlugError({
    site,
    normalizedSlug,
    isHome: modal.isHome,
  });

  return {
    normalizedSlug,
    nameError: nameResult.ok ? null : nameResult.error.message,
    slugError,
    canSubmit: nameResult.ok && (modal.isHome || !slugError),
  };
};

const deriveInlineRenameValidation = (
  site: SiteState,
  inlineRename: InlineRenameState
) => {
  if (!inlineRename) {
    return { nameError: null, canSubmit: false };
  }
  const result = validatePageName(inlineRename.draftName);
  const page = site.pages[inlineRename.pageId];
  const trimmed = inlineRename.draftName.trim();
  return {
    nameError: result.ok ? null : result.error.message,
    canSubmit: result.ok && !!page && trimmed !== page.name,
  };
};

const deriveInspectorValidation = (
  site: SiteState,
  inspector: InspectorDraftState
) => {
  if (!site.activePageId) {
    return {
      nameError: null,
      slugError: null,
      canCommitName: false,
      canCommitSlug: false,
    };
  }
  const page = site.pages[site.activePageId];
  if (!page) {
    return {
      nameError: null,
      slugError: null,
      canCommitName: false,
      canCommitSlug: false,
    };
  }

  const normalizedSlug = normalizeSlug(inspector.draftSlug);
  const nameResult = validatePageName(inspector.draftName);
  const slugError = deriveSlugError({
    site,
    normalizedSlug,
    isHome: page.isHome,
    pageId: site.activePageId ?? undefined,
  });

  const trimmedName = inspector.draftName.trim();
  const canCommitName = nameResult.ok && trimmedName !== page.name;
  const canCommitSlug =
    !page.isHome && !slugError && normalizedSlug !== page.slug;

  return {
    nameError: nameResult.ok ? null : nameResult.error.message,
    slugError,
    canCommitName,
    canCommitSlug,
  };
};

const deriveToggleHomeSlug = (
  site: SiteState,
  modal: CreatePageModalState,
  isHome: boolean
) => {
  if (isHome) return "/";
  if (modal.slugManuallyEdited) return modal.draftSlug;
  const trimmedName = modal.draftName.trim();
  if (!trimmedName) return "";
  return deriveUniqueSlugFromName(
    modal.draftName,
    Object.values(site.pages).map((page) => page.slug)
  );
};

export const createInitialState = (siteId: string): BuilderState => {
  const draft = siteId === "local" ? loadDraft() : null;
  const site = draft ?? createEmptySiteState();
  const hasPages = site.pageOrder.length > 0;
  return {
    siteId,
    site,
    editor: {
      mode: "edit",
      activeBreakpoint: "desktop",
      selectedNodeId: null,
    },
    ui: {
      createPageModal: emptyCreatePageModal(!hasPages),
      inlineRename: null,
      confirmDelete: null,
      inspector: createInspectorDraft(site),
      focusTarget: null,
    },
  };
};

export const builderReducer = (
  state: BuilderState,
  action: BuilderAction
): BuilderState => {
  switch (action.type) {
    case "editor/setBreakpoint":
      return {
        ...state,
        editor: { ...state.editor, activeBreakpoint: action.breakpoint },
      };
    case "editor/toggleMode":
      return {
        ...state,
        editor: {
          ...state.editor,
          mode: state.editor.mode === "edit" ? "preview" : "edit",
        },
      };
    case "ui/setCreatePageModal":
      return {
        ...state,
        ui: { ...state.ui, createPageModal: action.modal },
      };
    case "ui/setInlineRename":
      return {
        ...state,
        ui: { ...state.ui, inlineRename: action.inlineRename },
      };
    case "ui/setConfirmDelete":
      return {
        ...state,
        ui: { ...state.ui, confirmDelete: action.confirmDelete },
      };
    case "ui/setInspector":
      return {
        ...state,
        ui: { ...state.ui, inspector: action.inspector },
      };
    case "ui/setFocusTarget":
      return {
        ...state,
        ui: { ...state.ui, focusTarget: action.target },
      };
    case "site/commit": {
      const nextUi: BuilderUIState = {
        ...state.ui,
        ...action.ui,
        inspector: action.ui?.inspector ?? createInspectorDraft(action.site),
      };
      const nextEditor = action.editor
        ? { ...state.editor, ...action.editor }
        : state.editor;
      return {
        ...state,
        site: action.site,
        ui: nextUi,
        editor: nextEditor,
      };
    }
    default:
      return state;
  }
};

type BuilderStoreValue = {
  state: BuilderState;
  derived: BuilderDerivedState;
  actions: {
    setActiveBreakpoint: (breakpoint: Breakpoint) => void;
    toggleMode: () => void;
    saveDraft: () => void;
    openCreatePageModal: () => void;
    closeCreatePageModal: () => void;
    updateCreatePageName: (name: string) => void;
    updateCreatePageSlug: (slug: string) => void;
    toggleCreatePageHome: (isHome: boolean) => void;
    submitCreatePage: () => void;
    setActivePage: (pageId: PageId) => void;
    startInlineRename: (pageId: PageId) => void;
    updateInlineRename: (name: string) => void;
    commitInlineRename: () => void;
    cancelInlineRename: () => void;
    requestDeletePage: (pageId: PageId) => void;
    cancelDeletePage: () => void;
    confirmDeletePage: () => void;
    updateInspectorName: (name: string) => void;
    updateInspectorSlug: (slug: string) => void;
    commitInspectorName: () => void;
    commitInspectorSlug: () => void;
    setHomePage: () => void;
    clearFocusTarget: () => void;
  };
};

const BuilderStoreContext = createContext<BuilderStoreValue | null>(null);

export const BuilderStoreProvider = ({
  siteId,
  children,
}: {
  siteId: string;
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(builderReducer, siteId, createInitialState);

  const derived = useMemo<BuilderDerivedState>(() => {
    const activePageId = state.site.activePageId;
    const activePage = activePageId ? state.site.pages[activePageId] ?? null : null;
    const activeDocument = activePageId
      ? state.site.documents[activePageId] ?? null
      : null;
    return {
      hasPages: state.site.pageOrder.length > 0,
      activePageId,
      activePage,
      activeDocument,
      createPage: deriveCreatePageValidation(state.site, state.ui.createPageModal),
      inlineRename: deriveInlineRenameValidation(state.site, state.ui.inlineRename),
      inspector: deriveInspectorValidation(state.site, state.ui.inspector),
      dependency: (check) => checkDependency(state.site, check),
    };
  }, [state.site, state.ui.createPageModal, state.ui.inlineRename, state.ui.inspector]);

  const applyCommands = (
    commands: Command[],
    options?: {
      ui?: Partial<BuilderUIState>;
      editor?: Partial<BuilderEditorState>;
    }
  ): CommandResult => {
    let nextSite = state.site;
    for (const command of commands) {
      const normalized = normalizeCommand(command);
      const validation = validateCommand(nextSite, normalized);
      if (!validation.ok) {
        return { ok: false, error: validation.error } as CommandResult;
      }
      nextSite = applyCommand(nextSite, normalized);
    }

    if (siteId === "local") {
      saveDraft(nextSite);
    }

    const activeChanged = state.site.activePageId !== nextSite.activePageId;
    const editorPatch = {
      ...options?.editor,
      ...(activeChanged ? { selectedNodeId: null } : {}),
    };

    dispatch({
      type: "site/commit",
      site: nextSite,
      ui: options?.ui,
      editor: Object.keys(editorPatch).length ? editorPatch : undefined,
    });

    return { ok: true, state: nextSite } as CommandResult;
  };

  const actions = useMemo<BuilderStoreValue["actions"]>(
    () => ({
      setActiveBreakpoint: (breakpoint) =>
        dispatch({ type: "editor/setBreakpoint", breakpoint }),
      toggleMode: () => dispatch({ type: "editor/toggleMode" }),
      saveDraft: () => {
        saveDraft(state.site);
      },
      openCreatePageModal: () => {
        const isFirstPage = state.site.pageOrder.length === 0;
        const modal: CreatePageModalState = {
          open: true,
          draftName: "",
          draftSlug: isFirstPage ? "/" : "",
          nameTouched: false,
          slugTouched: false,
          slugManuallyEdited: false,
          isHome: isFirstPage,
        };
        dispatch({ type: "ui/setCreatePageModal", modal });
      },
      closeCreatePageModal: () => {
        const modal = emptyCreatePageModal(state.site.pageOrder.length === 0);
        dispatch({ type: "ui/setCreatePageModal", modal });
      },
      updateCreatePageName: (name) => {
        const modal = {
          ...state.ui.createPageModal,
          draftName: name,
          nameTouched: true,
        };
        if (!modal.slugManuallyEdited && !modal.isHome) {
          const existingSlugs = Object.values(state.site.pages).map(
            (page) => page.slug
          );
          const derived = name.trim()
            ? deriveUniqueSlugFromName(name, existingSlugs)
            : "";
          modal.draftSlug = derived;
        }
        dispatch({ type: "ui/setCreatePageModal", modal });
      },
      updateCreatePageSlug: (slug) => {
        const modal = {
          ...state.ui.createPageModal,
          draftSlug: slug,
          slugManuallyEdited: true,
          slugTouched: true,
        };
        dispatch({ type: "ui/setCreatePageModal", modal });
      },
      toggleCreatePageHome: (isHome) => {
        const nextSlug = deriveToggleHomeSlug(state.site, state.ui.createPageModal, isHome);
        const modal = {
          ...state.ui.createPageModal,
          isHome,
          slugManuallyEdited: isHome ? false : state.ui.createPageModal.slugManuallyEdited,
          draftSlug: nextSlug,
        };
        dispatch({ type: "ui/setCreatePageModal", modal });
      },
      submitCreatePage: () => {
        const validation = deriveCreatePageValidation(
          state.site,
          state.ui.createPageModal
        );
        if (!validation.canSubmit) {
          const modal = {
            ...state.ui.createPageModal,
            nameTouched: true,
            slugTouched: true,
          };
          dispatch({ type: "ui/setCreatePageModal", modal });
          return;
        }
        const pageId = createPageId();
        const now = Date.now();
        const name = state.ui.createPageModal.draftName.trim();
        const isHome = state.ui.createPageModal.isHome;
        const slug = isHome ? asSlug("/") : validation.normalizedSlug;
        const meta: PageMeta = {
          name,
          slug,
          isHome,
          createdAt: now,
          updatedAt: now,
        };
        const createCommand: Command = {
          type: "CREATE_PAGE",
          pageId,
          meta,
          document: createInitialDocument(pageId),
        };
        const setActive: Command = { type: "SET_ACTIVE_PAGE", pageId };

        const result = applyCommands([createCommand, setActive], {
          ui: {
            createPageModal: emptyCreatePageModal(false),
            inlineRename: null,
            confirmDelete: null,
            focusTarget: "inspector-name",
          },
          editor: { selectedNodeId: null },
        });
        if (!result.ok) {
          const modal = {
            ...state.ui.createPageModal,
            nameTouched: true,
            slugTouched: true,
          };
          dispatch({ type: "ui/setCreatePageModal", modal });
        }
      },
      setActivePage: (pageId) => {
        if (state.ui.confirmDelete) return;
        if (!state.site.pages[pageId]) return;
        const result = applyCommands([{ type: "SET_ACTIVE_PAGE", pageId }], {
          editor: { selectedNodeId: null },
        });
        if (!result.ok) return;
      },
      startInlineRename: (pageId) => {
        if (state.ui.confirmDelete) return;
        const page = state.site.pages[pageId];
        if (!page) return;
        const inlineRename: InlineRenameState = {
          pageId,
          draftName: page.name,
          nameTouched: false,
        };
        dispatch({ type: "ui/setInlineRename", inlineRename });
      },
      updateInlineRename: (name) => {
        if (!state.ui.inlineRename) return;
        dispatch({
          type: "ui/setInlineRename",
          inlineRename: { ...state.ui.inlineRename, draftName: name },
        });
      },
      commitInlineRename: () => {
        if (!state.ui.inlineRename) return;
        const validation = deriveInlineRenameValidation(
          state.site,
          state.ui.inlineRename
        );
        if (!validation.canSubmit) {
          dispatch({
            type: "ui/setInlineRename",
            inlineRename: {
              ...state.ui.inlineRename,
              nameTouched: true,
            },
          });
          return;
        }
        const pageId = state.ui.inlineRename.pageId;
        const name = state.ui.inlineRename.draftName.trim();
        const result = applyCommands([
          {
            type: "UPDATE_PAGE_META",
            pageId,
            patch: { name },
            timestamp: Date.now(),
          },
        ]);
        if (result.ok) {
          dispatch({ type: "ui/setInlineRename", inlineRename: null });
        }
      },
      cancelInlineRename: () => {
        dispatch({ type: "ui/setInlineRename", inlineRename: null });
      },
      requestDeletePage: (pageId) => {
        if (!state.site.pages[pageId]) return;
        dispatch({ type: "ui/setInlineRename", inlineRename: null });
        dispatch({ type: "ui/setConfirmDelete", confirmDelete: { pageId } });
      },
      cancelDeletePage: () => {
        dispatch({ type: "ui/setConfirmDelete", confirmDelete: null });
      },
      confirmDeletePage: () => {
        const target = state.ui.confirmDelete;
        if (!target) return;
        const result = applyCommands([{ type: "DELETE_PAGE", pageId: target.pageId }], {
          ui: { confirmDelete: null, inlineRename: null },
        });
        if (!result.ok) {
          dispatch({ type: "ui/setConfirmDelete", confirmDelete: null });
        }
      },
      updateInspectorName: (name) => {
        dispatch({
          type: "ui/setInspector",
          inspector: { ...state.ui.inspector, draftName: name },
        });
      },
      updateInspectorSlug: (slug) => {
        dispatch({
          type: "ui/setInspector",
          inspector: { ...state.ui.inspector, draftSlug: slug },
        });
      },
      commitInspectorName: () => {
        const validation = deriveInspectorValidation(state.site, state.ui.inspector);
        if (!validation.canCommitName) {
          dispatch({
            type: "ui/setInspector",
            inspector: { ...state.ui.inspector, nameTouched: true },
          });
          return;
        }
        const pageId = state.site.activePageId;
        if (!pageId) return;
        const name = state.ui.inspector.draftName.trim();
        applyCommands([
          {
            type: "UPDATE_PAGE_META",
            pageId,
            patch: { name },
            timestamp: Date.now(),
          },
        ]);
      },
      commitInspectorSlug: () => {
        const validation = deriveInspectorValidation(state.site, state.ui.inspector);
        if (!validation.canCommitSlug) {
          dispatch({
            type: "ui/setInspector",
            inspector: { ...state.ui.inspector, slugTouched: true },
          });
          return;
        }
        const pageId = state.site.activePageId;
        if (!pageId) return;
        const slug = normalizeSlug(state.ui.inspector.draftSlug);
        applyCommands([
          {
            type: "UPDATE_PAGE_META",
            pageId,
            patch: { slug },
            timestamp: Date.now(),
          },
        ]);
      },
      setHomePage: () => {
        const pageId = state.site.activePageId;
        if (!pageId) return;
        applyCommands([
          {
            type: "UPDATE_PAGE_META",
            pageId,
            patch: { isHome: true, slug: asSlug("/") },
            timestamp: Date.now(),
          },
        ]);
      },
      clearFocusTarget: () => {
        dispatch({ type: "ui/setFocusTarget", target: null });
      },
    }),
    [state, siteId]
  );

  const value = useMemo(() => ({ state, derived, actions }), [state, derived, actions]);

  return (
    <BuilderStoreContext.Provider value={value}>
      {children}
    </BuilderStoreContext.Provider>
  );
};

export const useBuilderStore = () => {
  const ctx = useContext(BuilderStoreContext);
  if (!ctx) {
    throw new Error("useBuilderStore must be used within BuilderStoreProvider");
  }
  return ctx;
};
