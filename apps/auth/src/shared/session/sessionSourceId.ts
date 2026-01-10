const SESSION_SOURCE_ID_KEY = "sitionix.auth.sessionSourceId";

function generateCryptoId(): string {
  // modern browsers
  if (typeof crypto !== "undefined") {
    if ("randomUUID" in crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    // fallback: 128-bit random hex
    if ("getRandomValues" in crypto && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `ssid_${hex}`;
    }
  }

  // last resort: no crypto available (very rare / non-browser)
  return `ssid_${Date.now()}`;
}

export function getOrCreateSessionSourceId(
  storage: Storage | undefined =
    typeof globalThis.window === "undefined" ? undefined : globalThis.window.localStorage,
): string {
  const existing = storage?.getItem(SESSION_SOURCE_ID_KEY);
  if (existing) return existing;

  const id = generateCryptoId();
  storage?.setItem(SESSION_SOURCE_ID_KEY, id);
  return id;
}
