import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TOKEN_STORAGE_KEYS } from "@sitionix/auth-session";
import { requestJson } from "../../../../shared/http/httpClient";
import { createSite, getSites } from "../../../../features/workspace/api/sitesApi";

vi.mock("../../../../shared/http/httpClient", () => ({
  requestJson: vi.fn(),
}));

const requestJsonMock = vi.mocked(requestJson);

const setSessionTokens = (accessToken: string, refreshToken: string, tokenType = "Bearer") => {
  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, accessToken);
  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, tokenType);
  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, "3600");
};

const setLocalTokens = (accessToken: string, refreshToken: string, tokenType = "Bearer") => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, tokenType);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, "3600");
};

describe("sitesApi.createSite", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends mapped payload and returns created site id", async () => {
    setLocalTokens("access-local", "refresh-local");

    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        siteId: "site-123",
        name: "My Site",
        status: "DRAFT",
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    });

    const result = await createSite({
      name: "  My Site  ",
      type: "business",
      description: "  Company website  ",
      template: "portfolio",
    });

    expect(result).toEqual({ id: "site-123" });
    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-local",
      },
      body: {
        name: "My Site",
        type: "BUSINESS",
        description: "Company website",
        template: "PORTFOLIO",
      },
    });
  });

  it("uses session storage token and defaults token type to Bearer", async () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "access-session");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, "refresh-session");

    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        siteId: "site-777",
        name: "Site",
        status: "DRAFT",
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    });

    await createSite({ name: "Site" });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-session",
      },
      body: {
        name: "Site",
      },
    });
  });

  it("prefers session storage token when both storages have values", async () => {
    setLocalTokens("access-local-old", "refresh-local-old");
    setSessionTokens("access-session-new", "refresh-session-new");

    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        siteId: "site-888",
        name: "Site",
        status: "DRAFT",
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    });

    await createSite({ name: "Site" });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-session-new",
      },
      body: {
        name: "Site",
      },
    });
  });

  it("falls back to local storage token when session token cannot be refreshed", async () => {
    const unauthorizedError = {
      code: 401,
      title: "Unauthorized",
      details: "Invalid access token",
    };
    setSessionTokens("access-session-stale", "refresh-session-stale");
    setLocalTokens("access-local-valid", "refresh-local-valid");

    requestJsonMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: unauthorizedError,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: {
          code: 401,
          title: "Unauthorized",
          details: "Invalid refresh token",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: {
          siteId: "site-fallback",
          name: "Site",
          status: "DRAFT",
          createdAt: "2026-02-18T00:00:00.000Z",
          updatedAt: "2026-02-18T00:00:00.000Z",
        },
      });

    const result = await createSite({ name: "Site" });

    expect(result).toEqual({ id: "site-fallback" });
    expect(requestJsonMock).toHaveBeenNthCalledWith(1, {
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-session-stale",
      },
      body: {
        name: "Site",
      },
    });
    expect(requestJsonMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: "POST",
        path: "/api/v1/auth/refresh",
        body: {
          refreshToken: "refresh-session-stale",
          sessionSourceId: expect.any(String),
        },
      })
    );
    expect(requestJsonMock).toHaveBeenNthCalledWith(3, {
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-local-valid",
      },
      body: {
        name: "Site",
      },
    });
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBeNull();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("access-local-valid");
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("refresh-local-valid");
  });

  it("refreshes access token and retries create request on 401", async () => {
    const unauthorizedError = {
      code: 401,
      title: "Unauthorized",
      details: "Invalid access token",
    };
    setSessionTokens("access-old", "refresh-old");

    requestJsonMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: unauthorizedError,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          accessToken: "access-new",
          refreshToken: "refresh-new",
          expiresIn: 3600,
          tokenType: "Bearer",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: {
          siteId: "site-999",
          name: "Site",
          status: "DRAFT",
          createdAt: "2026-02-18T00:00:00.000Z",
          updatedAt: "2026-02-18T00:00:00.000Z",
        },
      });

    const result = await createSite({ name: "Site" });

    expect(result).toEqual({ id: "site-999" });
    expect(requestJsonMock).toHaveBeenNthCalledWith(1, {
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-old",
      },
      body: {
        name: "Site",
      },
    });
    expect(requestJsonMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: "POST",
        path: "/api/v1/auth/refresh",
        body: {
          refreshToken: "refresh-old",
          sessionSourceId: expect.any(String),
        },
      })
    );
    expect(requestJsonMock).toHaveBeenNthCalledWith(3, {
      method: "POST",
      path: "/api/v1/sites",
      headers: {
        Authorization: "Bearer access-new",
      },
      body: {
        name: "Site",
      },
    });

    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBe("access-new");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBe("refresh-new");
  });

  it("clears tokens when refresh fails and keeps unauthorized error", async () => {
    const unauthorizedError = {
      code: 401,
      title: "Unauthorized",
      details: "Invalid access token",
    };
    const refreshError = {
      code: 401,
      title: "Unauthorized",
      details: "Invalid refresh token",
    };
    setSessionTokens("access-old", "refresh-old");

    requestJsonMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: unauthorizedError,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: refreshError,
      });

    await expect(createSite({ name: "Site" })).rejects.toEqual(unauthorizedError);
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)).toBeNull();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)).toBeNull();
  });

  it("throws when site name is blank", async () => {
    await expect(createSite({ name: "   " })).rejects.toThrow("Site name is required");
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("throws api error when request fails", async () => {
    const apiError = {
      code: 401,
      title: "Unauthorized",
      details: "Missing bearer token",
    };

    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: apiError,
    });

    await expect(createSite({ name: "Site" })).rejects.toEqual(apiError);
  });

  it("throws when response does not include siteId", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        siteId: "",
        name: "Site",
        status: "DRAFT",
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    });

    await expect(createSite({ name: "Site" })).rejects.toThrow(
      "Invalid create site response"
    );
  });
});

describe("sitesApi.getSites", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("calls bff sites endpoint with paging and auth header", async () => {
    setSessionTokens("access-token", "refresh-token");

    const response = {
      items: [
        {
          siteId: "site-1",
          name: "Alpha",
          status: "PUBLISHED",
          type: "BUSINESS",
          description: "Company site",
          createdAt: "2026-02-18T00:00:00.000Z",
          updatedAt: "2026-02-18T01:00:00.000Z",
        },
      ],
      page: 0,
      size: 20,
      hasNext: true,
    };

    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: response,
    });

    const result = await getSites({ page: 0, size: 20, sortBy: "date" });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/sites?sortBy=date&page=0&size=20",
      headers: {
        Authorization: "Bearer access-token",
      },
    });
    expect(result).toEqual({
      items: [
        {
          id: "site-1",
          name: "Alpha",
          domain: "",
          description: "Company site",
          seoTitle: null,
          seoDescription: null,
          type: "standalone",
          ecosystemName: null,
          collectionId: null,
          status: "published",
          createdAt: "2026-02-18T00:00:00.000Z",
          updatedAt: "2026-02-18T01:00:00.000Z",
          visits: 0,
          thumbnailUrl: null,
        },
      ],
      meta: {
        page: 0,
        size: 20,
        totalItems: 21,
        totalPages: 2,
      },
    });
  });

  it("throws api error when sites request fails", async () => {
    const apiError = {
      code: 401,
      title: "Unauthorized",
      details: "Missing bearer token",
    };

    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: apiError,
    });

    await expect(getSites({ page: 0, size: 20 })).rejects.toEqual(apiError);
  });
});
