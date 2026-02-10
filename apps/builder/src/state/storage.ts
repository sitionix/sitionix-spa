import { type BuilderDocument, isBuilderDocument } from "./document";

const STORAGE_KEY = "builder:draft";

export const saveDraft = (document: BuilderDocument) => {
  const win = globalThis.window;
  if (!win) return;
  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  } catch {
    // ignore storage failures
  }
};

export const loadDraft = (): BuilderDocument | null => {
  const win = globalThis.window;
  if (!win) return null;
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isBuilderDocument(parsed) ? parsed : null;
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
