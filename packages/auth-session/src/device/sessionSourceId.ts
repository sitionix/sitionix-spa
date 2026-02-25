const SESSION_SOURCE_ID_KEY = "sitionix.sessionSourceId";
const LEGACY_SESSION_SOURCE_ID_KEY = "sitionix.auth.sessionSourceId";

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const generateUuidV4 = (): string => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }

  return `ssid-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export function getOrCreateSessionSourceId(): string {
  const storage = getStorage();
  const existing = storage?.getItem(SESSION_SOURCE_ID_KEY);
  if (existing) {
    return existing;
  }

  const legacy = storage?.getItem(LEGACY_SESSION_SOURCE_ID_KEY);
  if (legacy) {
    storage?.setItem(SESSION_SOURCE_ID_KEY, legacy);
    storage?.removeItem(LEGACY_SESSION_SOURCE_ID_KEY);
    return legacy;
  }

  const generated = generateUuidV4();
  storage?.setItem(SESSION_SOURCE_ID_KEY, generated);
  return generated;
}
