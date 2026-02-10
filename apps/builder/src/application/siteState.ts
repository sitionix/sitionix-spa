import { createInitialDocument, isBuilderDocument } from "../domain/document";
import type { BuilderDocument } from "../domain/document";
import {
  ensureUniqueSlug,
  slugifyNameToSlug,
  type PageId,
  type PageMeta,
  type SiteState,
} from "../domain/pages";

const DEFAULT_HOME_NAME = "Home";

export const createPageId = (): PageId => {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `page-${random}`;
};

export const createEmptySiteState = (): SiteState => ({
  activePageId: null,
  pages: {},
  pageOrder: [],
  documents: {},
});

export const createSiteStateFromDocument = (
  document: BuilderDocument,
  options?: { name?: string; now?: number }
): SiteState => {
  const now = options?.now ?? Date.now();
  const pageId = createPageId();
  const meta: PageMeta = {
    name: options?.name ?? DEFAULT_HOME_NAME,
    slug: "/",
    isHome: true,
    createdAt: now,
    updatedAt: now,
  };
  return {
    activePageId: pageId,
    pages: { [pageId]: meta },
    pageOrder: [pageId],
    documents: {
      [pageId]: { ...document, pageId },
    },
  };
};

export const isSiteState = (value: unknown): value is SiteState => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SiteState;
  if (
    !Array.isArray(candidate.pageOrder) ||
    typeof candidate.pages !== "object" ||
    typeof candidate.documents !== "object"
  ) {
    return false;
  }

  const pageIds = Object.keys(candidate.pages);
  if (candidate.pageOrder.length !== pageIds.length) return false;
  if (!candidate.pageOrder.every((id) => pageIds.includes(id))) return false;
  if (!pageIds.every((id) => id in candidate.documents)) return false;

  if (pageIds.length === 0) {
    return candidate.activePageId === null;
  }

  if (!candidate.activePageId || !pageIds.includes(candidate.activePageId)) {
    return false;
  }

  const homeCount = pageIds.filter((id) => candidate.pages[id].isHome).length;
  if (homeCount !== 1) return false;

  return pageIds.every((id) => isBuilderDocument(candidate.documents[id]));
};

export const deriveUniqueSlugFromName = (
  name: string,
  existingSlugs: string[]
) => {
  const baseSlug = slugifyNameToSlug(name);
  return ensureUniqueSlug(baseSlug, existingSlugs);
};
