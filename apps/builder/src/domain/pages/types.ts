/* istanbul ignore file -- type-only module */
import type { BuilderDocument } from "../document";

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
  code:
    | "required"
    | "invalid"
    | "duplicate"
    | "reserved"
    | "too_long"
    | "not_found"
    | "home_only";
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
