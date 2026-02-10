import { isBuilderDocument } from "../domain/document";
import type { SiteState } from "../domain/pages";
import { createSiteStateFromDocument, isSiteState } from "./siteState";

const STORAGE_KEY = "builder:draft";

export const saveDraft = (site: SiteState) => {
  const win = globalThis.window;
  if (!win) return;
  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
  } catch {
    // ignore storage failures
  }
};

export const loadDraft = (): SiteState | null => {
  const win = globalThis.window;
  if (!win) return null;
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isSiteState(parsed)) return parsed;
    if (isBuilderDocument(parsed)) {
      return createSiteStateFromDocument(parsed);
    }
    return null;
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  const win = globalThis.window;
  if (!win) return;
  try {
    win.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};

export { STORAGE_KEY };
