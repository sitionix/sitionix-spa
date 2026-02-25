import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../device/sessionSourceId", () => ({
  getOrCreateSessionSourceId: vi.fn(() => "ssid-1"),
}));

import { getOrCreateSessionSourceId } from "../../device/sessionSourceId";
import {
  createRefreshClient,
  RefreshClientError,
} from "../../refresh/refreshClient";

describe("createRefreshClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Given successful refresh response When calling client Then returns access payload", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "next-token",
          expiresIn: 1800,
          tokenType: "Bearer",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );
    const refreshClient = createRefreshClient({
      baseUrl: "https://localhost:3000/bffssox",
      fetchImpl,
    });

    // When
    const response = await refreshClient();

    // Then
    expect(response).toEqual({
      accessToken: "next-token",
      expiresIn: 1800,
      tokenType: "Bearer",
    });
    expect(getOrCreateSessionSourceId).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://localhost:3000/bffssox/api/v1/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("Given non-ok response When calling client Then throws RefreshClientError with status", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 401,
          title: "Unauthorized",
          details: "Expired refresh token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );
    const refreshClient = createRefreshClient({ fetchImpl });

    // When / Then
    await expect(refreshClient()).rejects.toEqual(
      expect.objectContaining<Partial<RefreshClientError>>({
        name: "RefreshClientError",
        status: 401,
      })
    );
  });

  it("Given invalid response payload When calling client Then throws RefreshClientError", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "token",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );
    const refreshClient = createRefreshClient({ fetchImpl });

    // When / Then
    await expect(refreshClient()).rejects.toEqual(
      expect.objectContaining<Partial<RefreshClientError>>({
        name: "RefreshClientError",
        status: 200,
      })
    );
  });
});
