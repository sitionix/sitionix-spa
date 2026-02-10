import type {
  DependencyCheck,
  DependencyResult,
  PageId,
  PageMeta,
  SiteState,
  Slug,
} from "./types";
import { slugifyNameToSlug } from "./slug";
import { asSlug } from "./types";

export const ensureUniqueSlug = (baseSlug: Slug, existingSlugs: Slug[]): Slug => {
  const existing = new Set(existingSlugs);
  if (!existing.has(baseSlug)) return baseSlug;
  const root = baseSlug === "/" ? "/home" : baseSlug;
  let index = 2;
  let candidate = `${root}-${index}`;
  while (existing.has(asSlug(candidate))) {
    index += 1;
    candidate = `${root}-${index}`;
  }
  return asSlug(candidate);
};

export const checkDependency = (
  state: SiteState,
  check: DependencyCheck
): DependencyResult => {
  switch (check.type) {
    case "REQUIRES_AT_LEAST_ONE_PAGE":
      return state.pageOrder.length > 0 ? { ok: true } : { ok: false, reason: check };
    case "REQUIRES_ACTIVE_PAGE":
      if (!state.activePageId) {
        return { ok: false, reason: check };
      }
      return state.pages[state.activePageId]
        ? { ok: true }
        : { ok: false, reason: check };
    default:
      return { ok: true };
  }
};

export const applyHomePolicy = (
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
      slug: asSlug("/"),
      updatedAt: timestamp ?? nextHome.updatedAt,
    };
  }

  return updatedPages;
};

export const ensureHomeExists = (
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
