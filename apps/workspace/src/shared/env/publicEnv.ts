const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
if (!apiBaseUrl) {
  throw new Error("Missing required env variable: VITE_API_BASE_URL");
}

function parseBooleanFlag(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (typeof rawValue !== "string") {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export const publicEnv = {
  apiBaseUrl,
  ffAgentChatTypingIndicator: parseBooleanFlag(import.meta.env.VITE_FF_AGENT_CHAT_TYPING_INDICATOR as string | undefined, true),
};
