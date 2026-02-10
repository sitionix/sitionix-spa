import { type BuilderDocument, isBuilderDocument } from "./document";

const STORAGE_KEY = "builder:draft";

export const saveDraft = (document: BuilderDocument) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  } catch {
    // ignore storage failures
  }
};

export const loadDraft = (): BuilderDocument | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isBuilderDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};

export { STORAGE_KEY };
