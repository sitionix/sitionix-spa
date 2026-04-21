import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadPublicEnv() {
  return import("../../../shared/env/publicEnv");
}

describe("publicEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("givenApiBaseUrlAndNoFlag_whenLoadPublicEnv_thenTypingIndicatorDefaultsToTrue", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
    vi.stubEnv("VITE_FF_AGENT_CHAT_TYPING_INDICATOR", undefined);

    const { publicEnv } = await loadPublicEnv();

    expect(publicEnv.apiBaseUrl).toBe("http://localhost:8080");
    expect(publicEnv.ffAgentChatTypingIndicator).toBe(true);
  });

  it.each(["1", "true", "yes", "on"])(
    "givenTruthyFlagValue_%s_whenLoadPublicEnv_thenTypingIndicatorFlagIsTrue",
    async (flagValue) => {
      vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
      vi.stubEnv("VITE_FF_AGENT_CHAT_TYPING_INDICATOR", flagValue);

      const { publicEnv } = await loadPublicEnv();

      expect(publicEnv.ffAgentChatTypingIndicator).toBe(true);
    }
  );

  it.each(["0", "false", "no", "off"])(
    "givenFalsyFlagValue_%s_whenLoadPublicEnv_thenTypingIndicatorFlagIsFalse",
    async (flagValue) => {
      vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
      vi.stubEnv("VITE_FF_AGENT_CHAT_TYPING_INDICATOR", flagValue);

      const { publicEnv } = await loadPublicEnv();

      expect(publicEnv.ffAgentChatTypingIndicator).toBe(false);
    }
  );

  it("givenInvalidFlagValue_whenLoadPublicEnv_thenTypingIndicatorUsesDefaultTrue", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
    vi.stubEnv("VITE_FF_AGENT_CHAT_TYPING_INDICATOR", "maybe");

    const { publicEnv } = await loadPublicEnv();

    expect(publicEnv.ffAgentChatTypingIndicator).toBe(true);
  });

  it("givenMissingApiBaseUrl_whenLoadPublicEnv_thenThrowMissingEnvError", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "   ");

    await expect(loadPublicEnv()).rejects.toThrow("Missing required env variable: VITE_API_BASE_URL");
  });
});

