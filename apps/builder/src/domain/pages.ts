import type { BuilderDocument } from "./document";

export type PageId = string;
export type Slug = string;

export type PageMeta = {
  name: string;
  slug: Slug;
  isHome: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SiteState = {
  activePageId: PageId | null;
  pages: Record<PageId, PageMeta>;
  pageOrder: PageId[];
  documents: Record<PageId, BuilderDocument>;
};

export type ValidationError = {
  code: "required" | "invalid" | "duplicate" | "reserved" | "too_long" | "not_found" | "home_only";
  field?: "name" | "slug";
  message: string;
  conflictId?: PageId;
};

export type ValidationResult = { ok: true } | { ok: false; error: ValidationError };
export type CommandResult =
  | { ok: true; state: SiteState }
  | { ok: false; error: ValidationError };

export type DependencyCheck =
  | { type: "REQUIRES_AT_LEAST_ONE_PAGE" }
  | { type: "REQUIRES_ACTIVE_PAGE" };

export type DependencyResult = { ok: true } | { ok: false; reason: DependencyCheck };

export type PageMetaPatch = Partial<Pick<PageMeta, "name" | "slug" | "isHome">>;

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

const MAX_SLUG_LENGTH = 120;
const MAX_NAME_LENGTH = 60;
const RESERVED_SLUGS = ["/api", "/_internal", "/builder"];

export const normalizeSlug = (input: string): Slug => {
  let raw = input.trim().toLowerCase();
  if (!raw) return "";
  raw = raw.replace(/\\/g, "/");
  if (!raw.startsWith("/")) {
    raw = `/${raw}`;
  }
  raw = raw.replace(/\/{2,}/g, "/");
  if (raw.length > 1 && raw.endsWith("/")) {
    raw = raw.slice(0, -1);
  }
  return raw;
};

export const slugifyNameToSlug = (name: string): Slug => {
  const trimmed = name.trim().toLowerCase();
  const slugBody = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/${slugBody || "page-1"}`;
};

export const validateSlug = (slug: string): ValidationResult => {
  if (!slug.trim()) {
    return {
      ok: false,
      error: { code: "required", field: "slug", message: "Slug is required." },
    };
  }

  if (!slug.startsWith("/")) {
    return {
      ok: false,
      error: { code: "invalid", field: "slug", message: "Slug must start with /." },
    };
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return {
      ok: false,
      error: {
        code: "too_long",
        field: "slug",
        message: `Slug must be ${MAX_SLUG_LENGTH} characters or less.`,
      },
    };
  }

  if (slug !== "/" && slug.endsWith("/")) {
    return {
      ok: false,
      error: {
        code: "invalid",
        field: "slug",
        message: "Slug cannot end with /.",
      },
    };
  }

  if (slug.includes("//")) {
    return {
      ok: false,
      error: {
        code: "invalid",
        field: "slug",
        message: "Slug cannot include empty segments.",
      },
    };
  }

  if (/\s/.test(slug)) {
    return {
      ok: false,
      error: {
        code: "invalid",
        field: "slug",
        message: "Slug cannot include spaces.",
      },
    };
  }

  if (!/^\/[a-z0-9\/-]*$/.test(slug)) {
    return {
      ok: false,
      error: {
        code: "invalid",
        field: "slug",
        message: "Slug contains invalid characters.",
      },
    };
  }

  if (slug !== "/") {
    const segments = slug.split("/").slice(1);
    if (segments.some((segment) => segment.length === 0)) {
      return {
        ok: false,
        error: {
          code: "invalid",
          field: "slug",
          message: "Slug cannot include empty segments.",
        },
      };
    }
  }

  const reserved = RESERVED_SLUGS.find(
    (entry) => slug === entry || slug.startsWith(`${entry}/`)
  );
  if (reserved) {
    return {
      ok: false,
      error: { code: "reserved", field: "slug", message: "That path is reserved." },
    };
  }

  return { ok: true };
};

export const validatePageName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: { code: "required", field: "name", message: "Name is required." },
    };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: {
        code: "too_long",
        field: "name",
        message: `Name must be ${MAX_NAME_LENGTH} characters or less.`,
      },
    };
  }
  return { ok: true };
};

export const validateUniqueSlug = (
  state: SiteState,
  slug: Slug,
  pageId?: PageId
): ValidationResult => {
  const conflict = Object.entries(state.pages).find(
    ([id, meta]) => meta.slug === slug && id !== pageId
  );
  if (conflict) {
    return {
      ok: false,
      error: {
        code: "duplicate",
        field: "slug",
        message: "Slug already in use.",
        conflictId: conflict[0],
      },
    };
  }
  return { ok: true };
};

export const ensureUniqueSlug = (
  baseSlug: Slug,
  existingSlugs: Slug[]
): Slug => {
  const existing = new Set(existingSlugs);
  if (!existing.has(baseSlug)) return baseSlug;
  const root = baseSlug === "/" ? "/home" : baseSlug;
  let index = 2;
  let candidate = `${root}-${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${root}-${index}`;
  }
  return candidate;
};

export const checkDependency = (
  state: SiteState,
  check: DependencyCheck
): DependencyResult => {
  switch (check.type) {
    case "REQUIRES_AT_LEAST_ONE_PAGE":
      return state.pageOrder.length > 0 ? { ok: true } : { ok: false, reason: check };
    case "REQUIRES_ACTIVE_PAGE":
      return state.activePageId && state.pages[state.activePageId]
        ? { ok: true }
        : { ok: false, reason: check };
    default:
      return { ok: true };
  }
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

export const validateCommand = (
  state: SiteState,
  command: Command
): ValidationResult => {
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
          uniqueResult.error.conflictId &&
          state.pages[uniqueResult.error.conflictId];
        const canSwapHome =
          command.meta.isHome &&
          command.meta.slug === "/" &&
          conflict?.isHome;
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
            uniqueResult.error.conflictId &&
            state.pages[uniqueResult.error.conflictId];
          const canSwapHome =
            nextIsHome && nextSlug === "/" && conflict?.isHome;
          if (!canSwapHome) return uniqueResult;
        }
      }

      return { ok: true };
    }
    default:
      return { ok: true };
  }
};

const applyHomePolicy = (
  pages: Record<PageId, PageMeta>,
  newHomeId: PageId,
  timestamp?: number
) => {
  const updatedPages: Record<PageId, PageMeta> = { ...pages };
  const previousHomeId = Object.keys(updatedPages).find(
    (id) => updatedPages[id].isHome && id !== newHomeId
  );

  if (previousHomeId) {
    const previous = updatedPages[previousHomeId];
    const existingSlugs = Object.entries(updatedPages)
      .filter(([id]) => id !== previousHomeId)
      .map(([, meta]) => meta.slug);
    const fallbackSlug = ensureUniqueSlug(
      slugifyNameToSlug(previous.name),
      existingSlugs
    );
    updatedPages[previousHomeId] = {
      ...previous,
      isHome: false,
      slug: previous.slug === "/" ? fallbackSlug : previous.slug,
      updatedAt: timestamp ?? previous.updatedAt,
    };
  }

  const nextHome = updatedPages[newHomeId];
  if (nextHome) {
    updatedPages[newHomeId] = {
      ...nextHome,
      isHome: true,
      slug: "/",
      updatedAt: timestamp ?? nextHome.updatedAt,
    };
  }

  return updatedPages;
};

const ensureHomeExists = (
  pages: Record<PageId, PageMeta>,
  pageOrder: PageId[],
  timestamp?: number
) => {
  if (pageOrder.length === 0) return pages;
  const hasHome = pageOrder.some((pageId) => pages[pageId]?.isHome);
  if (hasHome) return pages;
  const fallbackId = pageOrder[0];
  return applyHomePolicy(pages, fallbackId, timestamp);
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
        const nextCandidate =
          nextOrder[index] ?? nextOrder[index - 1] ?? null;
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
