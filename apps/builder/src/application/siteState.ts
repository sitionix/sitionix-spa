import { isBuilderDocument } from "../domain/document";
import type { BuilderDocument } from "../domain/document";
import {
  asPageId,
  asSlug,
  ensureUniqueSlug,
  slugifyNameToSlug,
  type PageId,
  type PageMeta,
  type Slug,
  type SiteState,
} from "../domain/pages";

const DEFAULT_HOME_NAME = "Home";
let fallbackCounter = 0;

const createRandomToken = () => {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  if (cryptoRef?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoRef.getRandomValues(bytes);
    let value = "";
    for (const byte of bytes) {
      value += byte.toString(16).padStart(2, "0");
    }
    return value;
  }
  fallbackCounter += 1;
  return `${Date.now().toString(36)}-${fallbackCounter}`;
};

export const createPageId = (): PageId => {
  const token = createRandomToken();
  return asPageId(`page-${token}`);
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
    slug: asSlug("/"),
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
  existingSlugs: Slug[]
) => {
  const baseSlug = slugifyNameToSlug(name);
  return ensureUniqueSlug(baseSlug, existingSlugs);
};
