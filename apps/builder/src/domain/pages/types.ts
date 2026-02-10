/* istanbul ignore file -- type-only module */
import type { BuilderDocument } from "../document";

type Brand<T, Tag extends string> = T & { readonly __brand: Tag };

export type PageId = Brand<string, "PageId">;
export type Slug = Brand<string, "Slug">;

export const asPageId = (value: string): PageId => value as PageId;
export const asSlug = (value: string): Slug => value as Slug;

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
