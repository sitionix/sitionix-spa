import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureAuthSessionBridge,
  requestJson,
} from "@sitionix/http-client";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

describe("http-client auth middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    configureAuthSessionBridge(null);
  });

  it("retries protected request once after 401 and successful refresh", async () => {
    // Given
    const refresh = vi.fn().mockResolvedValue("fresh-token");
    configureAuthSessionBridge({
      getAccessToken: () => "expired-token",
      refresh,
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(401, {
          code: 401,
          title: "Unauthorized",
          details: "Expired",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          items: [],
          page: 0,
          size: 20,
          hasNext: false,
        })
      );

    // When
    const result = await requestJson<
      { items: unknown[]; page: number; size: number; hasNext: boolean },
      { code: number; title: string; details: string },
      undefined
    >({
      baseUrl: "http://localhost",
      method: "GET",
      path: "/api/v1/sites",
    });

    // Then
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
    expect(fetchMock.mock.calls[1][1]?.credentials).toBe("include");
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer expired-token",
      })
    );
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer fresh-token",
      })
    );
    expect(result.ok).toBe(true);
  });

  it("does not recurse refresh logic on refresh endpoint", async () => {
    // Given
    const refresh = vi.fn().mockResolvedValue("fresh-token");
    configureAuthSessionBridge({
      getAccessToken: () => "expired-token",
      refresh,
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse(401, {
          code: 401,
          title: "Unauthorized",
          details: "Invalid refresh token",
        })
      );

    // When
    const result = await requestJson<
      { accessToken: string; expiresIn: number; tokenType: string },
      { code: number; title: string; details: string },
      { sessionSourceId: string }
    >({
      baseUrl: "http://localhost",
      method: "POST",
      path: "/api/v1/auth/refresh",
      body: { sessionSourceId: "ssid-1" },
    });

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});
