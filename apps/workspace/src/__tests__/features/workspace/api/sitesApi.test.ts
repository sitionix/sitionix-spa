import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TOKEN_STORAGE_KEYS } from "@sitionix/auth-session";
import { requestJson } from "../../../../shared/http/httpClient";
import { createSite, getSites } from "../../../../features/workspace/api/sitesApi";

vi.mock("../../../../shared/http/httpClient", () => ({
  requestJson: vi.fn(),
}));

const requestJsonMock = vi.mocked(requestJson);

describe("sitesApi.createSite", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends mapped payload and returns created site id", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "access-local");
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");

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
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "access-local-old");
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "access-session-new");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");

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

  it("calls real workspace sites endpoint with paging and auth header", async () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, "access-token");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, "Bearer");

    const response = {
      items: [],
      meta: {
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      },
    };

    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: response,
    });

    await getSites({ page: 0, size: 20, sortBy: "date" });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/workspace/sites?sortBy=date&page=0&size=20",
      headers: {
        Authorization: "Bearer access-token",
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
