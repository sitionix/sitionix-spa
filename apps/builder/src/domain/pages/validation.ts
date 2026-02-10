import type { PageId, SiteState, Slug, ValidationResult } from "./types";

const MAX_SLUG_LENGTH = 120;
const MAX_NAME_LENGTH = 60;
const RESERVED_SLUGS = ["/api", "/_internal", "/builder"];

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

  for (const char of slug) {
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      return {
        ok: false,
        error: {
          code: "invalid",
          field: "slug",
          message: "Slug cannot include spaces.",
        },
      };
    }
  }

  for (const char of slug) {
    const isAlpha = char >= "a" && char <= "z";
    const isDigit = char >= "0" && char <= "9";
    const isAllowed = isAlpha || isDigit || char === "/" || char === "-";
    if (!isAllowed) {
      return {
        ok: false,
        error: {
          code: "invalid",
          field: "slug",
          message: "Slug contains invalid characters.",
        },
      };
    }
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
