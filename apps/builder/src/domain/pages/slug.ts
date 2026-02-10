import type { Slug } from "./types";

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
