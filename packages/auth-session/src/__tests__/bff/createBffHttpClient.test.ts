import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBffHttpClient } from "../../bff/createBffHttpClient";

describe("createBffHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Given non-401 response When fetchApi called Then returns first response", async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );
    const sessionManager = {
      getAccessToken: vi.fn(() => "initial-token"),
      refresh: vi.fn().mockResolvedValue("refreshed-token"),
    };
    const client = createBffHttpClient("http://localhost", sessionManager);

    // When
    const response = await client.configuration.fetchApi("/api/v1/agents", {
      method: "GET",
    });

    // Then
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sessionManager.refresh).not.toHaveBeenCalled();
  });

  it("Given protected 401 and successful refresh When fetchApi called Then retries with Authorization header", async () => {
    // Given
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const sessionManager = {
      getAccessToken: vi.fn(() => "initial-token"),
      refresh: vi.fn().mockResolvedValue("refreshed-token"),
    };
    const client = createBffHttpClient("http://localhost", sessionManager);

    // When
    const response = await client.configuration.fetchApi("/api/v1/agents", {
      method: "GET",
    });

    // Then
    expect(response.status).toBe(200);
    expect(sessionManager.refresh).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const secondCallOptions = fetchSpy.mock.calls[1]?.[1] as RequestInit;
    const secondCallHeaders = new Headers(secondCallOptions.headers);
    expect(secondCallHeaders.get("Authorization")).toBe("Bearer refreshed-token");
    expect(secondCallOptions.credentials).toBe("include");
  });

  it("Given refresh endpoint 401 When fetchApi called Then does not retry", async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    );
    const sessionManager = {
      getAccessToken: vi.fn(() => "initial-token"),
      refresh: vi.fn().mockResolvedValue("refreshed-token"),
    };
    const client = createBffHttpClient("http://localhost", sessionManager);

    // When
    const response = await client.configuration.fetchApi("/api/v1/auth/refresh", {
      method: "POST",
    });

    // Then
    expect(response.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sessionManager.refresh).not.toHaveBeenCalled();
  });

  it("Given protected 401 and empty refresh token When fetchApi called Then returns first response", async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    );
    const sessionManager = {
      getAccessToken: vi.fn(() => "initial-token"),
      refresh: vi.fn().mockResolvedValue(null),
    };
    const client = createBffHttpClient("http://localhost", sessionManager);

    // When
    const response = await client.configuration.fetchApi("/api/v1/agents", {
      method: "GET",
    });

    // Then
    expect(response.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sessionManager.refresh).toHaveBeenCalledTimes(1);
  });

  it("Given missing access token When accessToken callback invoked Then returns empty string", async () => {
    // Given
    const sessionManager = {
      getAccessToken: vi.fn(() => null),
      refresh: vi.fn().mockResolvedValue("refreshed-token"),
    };
    const client = createBffHttpClient("http://localhost", sessionManager);

    // When
    const token = await client.configuration.accessToken();

    // Then
    expect(token).toBe("");
  });
});

