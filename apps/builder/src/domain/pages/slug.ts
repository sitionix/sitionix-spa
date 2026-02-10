import { asSlug, type Slug } from "./types";

export const normalizeSlug = (input: string): Slug => {
  let raw = input.trim().toLowerCase();
  if (!raw) return asSlug("");
  raw = raw.replaceAll("\\", "/");
  if (!raw.startsWith("/")) {
    raw = `/${raw}`;
  }

  let normalized = "";
  let previousSlash = false;
  for (const char of raw) {
    if (char === "/") {
      if (!previousSlash) {
        normalized += "/";
        previousSlash = true;
      }
      continue;
    }
    previousSlash = false;
    normalized += char;
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return asSlug(normalized);
};

export const slugifyNameToSlug = (name: string): Slug => {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return asSlug("/page-1");

  let body = "";
  let previousDash = false;
  for (const char of trimmed) {
    const isAlpha = char >= "a" && char <= "z";
    const isDigit = char >= "0" && char <= "9";
    if (isAlpha || isDigit) {
      body += char;
      previousDash = false;
      continue;
    }
    if (!previousDash) {
      body += "-";
      previousDash = true;
    }
  }

  while (body.startsWith("-")) body = body.slice(1);
  while (body.endsWith("-")) body = body.slice(0, -1);
  if (!body) body = "page-1";

  return asSlug(`/${body}`);
};
