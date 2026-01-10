const SESSION_SOURCE_ID_KEY = "sitionix.auth.sessionSourceId";

function fallbackSessionSourceId(): string {
  const randomPart = Math.random().toString(16).slice(2);
  return `ssid_${Date.now()}_${randomPart}`;
}

function generateSessionSourceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return fallbackSessionSourceId();
}

export function getOrCreateSessionSourceId(): string {
  if (typeof localStorage === "undefined") {
    return generateSessionSourceId();
  }

  const stored = localStorage.getItem(SESSION_SOURCE_ID_KEY);
  if (stored) {
    return stored;
  }

  const nextValue = generateSessionSourceId();
  localStorage.setItem(SESSION_SOURCE_ID_KEY, nextValue);
  return nextValue;
}
