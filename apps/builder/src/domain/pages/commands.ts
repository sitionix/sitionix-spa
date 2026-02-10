import type { BuilderDocument } from "../document";
import type {
  CommandResult,
  PageId,
  PageMeta,
  PageMetaPatch,
  SiteState,
  ValidationResult,
} from "./types";
import { normalizeSlug } from "./slug";
import { ensureHomeExists, applyHomePolicy } from "./policies";
import { validatePageName, validateSlug, validateUniqueSlug } from "./validation";

export type Command =
  | {
      type: "CREATE_PAGE";
      pageId: PageId;
      meta: PageMeta;
      document: BuilderDocument;
    }
  | { type: "DELETE_PAGE"; pageId: PageId }
  | { type: "SET_ACTIVE_PAGE"; pageId: PageId }
  | {
      type: "UPDATE_PAGE_META";
      pageId: PageId;
      patch: PageMetaPatch;
      timestamp?: number;
    };

export const normalizeCommand = (command: Command): Command => {
  switch (command.type) {
    case "CREATE_PAGE": {
      return {
        ...command,
        meta: {
          ...command.meta,
          name: command.meta.name.trim(),
          slug: normalizeSlug(command.meta.slug),
        },
      };
    }
    case "UPDATE_PAGE_META": {
      const patch = { ...command.patch };
      if (typeof patch.name === "string") {
        patch.name = patch.name.trim();
      }
      if (typeof patch.slug === "string") {
        patch.slug = normalizeSlug(patch.slug);
      }
      return { ...command, patch };
    }
    default:
      return command;
  }
};

export const validateCommand = (state: SiteState, command: Command): ValidationResult => {
  switch (command.type) {
    case "CREATE_PAGE": {
      if (state.pages[command.pageId]) {
        return {
          ok: false,
          error: { code: "duplicate", message: "Page already exists." },
        };
      }
      const nameResult = validatePageName(command.meta.name);
      if (!nameResult.ok) return nameResult;

      const slugResult = validateSlug(command.meta.slug);
      if (!slugResult.ok) return slugResult;

      if (command.meta.isHome && command.meta.slug !== "/") {
        return {
          ok: false,
          error: {
            code: "home_only",
            field: "slug",
            message: "Home page must use /.",
          },
        };
      }

      if (!command.meta.isHome && command.meta.slug === "/") {
        return {
          ok: false,
          error: {
            code: "home_only",
            field: "slug",
            message: "Only the home page can use /.",
          },
        };
      }

      const uniqueResult = validateUniqueSlug(state, command.meta.slug);
      if (!uniqueResult.ok) {
        const conflict =
          uniqueResult.error.conflictId && state.pages[uniqueResult.error.conflictId];
        const canSwapHome = command.meta.isHome && command.meta.slug === "/" && conflict?.isHome;
        if (!canSwapHome) return uniqueResult;
      }

      if (
        !command.document ||
        !command.document.rootId ||
        !command.document.nodes?.[command.document.rootId]
      ) {
        return {
          ok: false,
          error: { code: "invalid", message: "Document is invalid." },
        };
      }

      return { ok: true };
    }
    case "DELETE_PAGE": {
      if (!state.pages[command.pageId]) {
        return {
          ok: false,
          error: { code: "not_found", message: "Page not found." },
        };
      }
      return { ok: true };
    }
    case "SET_ACTIVE_PAGE": {
      if (!state.pages[command.pageId]) {
        return {
          ok: false,
          error: { code: "not_found", message: "Page not found." },
        };
      }
      return { ok: true };
    }
    case "UPDATE_PAGE_META": {
      const current = state.pages[command.pageId];
      if (!current) {
        return {
          ok: false,
          error: { code: "not_found", message: "Page not found." },
        };
      }

      const nextIsHome = command.patch.isHome ?? current.isHome;
      const nextSlug = command.patch.slug ?? current.slug;

      if (typeof command.patch.name === "string") {
        const nameResult = validatePageName(command.patch.name);
        if (!nameResult.ok) return nameResult;
      }

      if (typeof command.patch.slug === "string") {
        const slugResult = validateSlug(command.patch.slug);
        if (!slugResult.ok) return slugResult;
      }

      if (nextIsHome && nextSlug !== "/") {
        return {
          ok: false,
          error: {
            code: "home_only",
            field: "slug",
            message: "Home page must use /.",
          },
        };
      }

      if (!nextIsHome && nextSlug === "/") {
        return {
          ok: false,
          error: {
            code: "home_only",
            field: "slug",
            message: "Only the home page can use /.",
          },
        };
      }

      if (typeof command.patch.slug === "string") {
        const uniqueResult = validateUniqueSlug(state, nextSlug, command.pageId);
        if (!uniqueResult.ok) {
          const conflict =
            uniqueResult.error.conflictId && state.pages[uniqueResult.error.conflictId];
          const canSwapHome = nextIsHome && nextSlug === "/" && conflict?.isHome;
          if (!canSwapHome) return uniqueResult;
        }
      }

      return { ok: true };
    }
    default:
      return { ok: true };
  }
};

export const applyCommand = (state: SiteState, command: Command): SiteState => {
  switch (command.type) {
    case "CREATE_PAGE": {
      const nextPages = {
        ...state.pages,
        [command.pageId]: command.meta,
      };
      const nextDocuments = {
        ...state.documents,
        [command.pageId]: command.document,
      };
      const nextOrder = [...state.pageOrder, command.pageId];
      const pagesWithHome = command.meta.isHome
        ? applyHomePolicy(nextPages, command.pageId, command.meta.updatedAt)
        : nextPages;
      const ensuredHome = ensureHomeExists(
        pagesWithHome,
        nextOrder,
        command.meta.updatedAt
      );
      return {
        ...state,
        pages: ensuredHome,
        documents: nextDocuments,
        pageOrder: nextOrder,
      };
    }
    case "DELETE_PAGE": {
      if (!state.pages[command.pageId]) return state;
      const nextPages = { ...state.pages };
      const nextDocuments = { ...state.documents };
      delete nextPages[command.pageId];
      delete nextDocuments[command.pageId];
      const nextOrder = state.pageOrder.filter((id) => id !== command.pageId);

      let nextActive = state.activePageId;
      if (state.activePageId === command.pageId) {
        const index = state.pageOrder.indexOf(command.pageId);
        // Deterministic: pick next page in order, otherwise previous, otherwise null.
        const nextCandidate = nextOrder[index] ?? nextOrder[index - 1] ?? null;
        nextActive = nextCandidate ?? null;
      }

      const pagesWithHome = ensureHomeExists(nextPages, nextOrder);

      return {
        ...state,
        activePageId: nextActive,
        pages: pagesWithHome,
        documents: nextDocuments,
        pageOrder: nextOrder,
      };
    }
    case "SET_ACTIVE_PAGE": {
      if (state.activePageId === command.pageId) return state;
      return {
        ...state,
        activePageId: command.pageId,
      };
    }
    case "UPDATE_PAGE_META": {
      const current = state.pages[command.pageId];
      if (!current) return state;
      const timestamp = command.timestamp ?? current.updatedAt;
      const nextMeta: PageMeta = {
        ...current,
        ...command.patch,
        updatedAt: timestamp,
      };
      let nextPages = {
        ...state.pages,
        [command.pageId]: nextMeta,
      };

      if (command.patch.isHome) {
        nextPages = applyHomePolicy(nextPages, command.pageId, timestamp);
      }

      nextPages = ensureHomeExists(nextPages, state.pageOrder, timestamp);

      return {
        ...state,
        pages: nextPages,
      };
    }
    default:
      return state;
  }
};

export const runCommand = (state: SiteState, command: Command): CommandResult => {
  const normalized = normalizeCommand(command);
  const validation = validateCommand(state, normalized);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }
  return { ok: true, state: applyCommand(state, normalized) };
};
