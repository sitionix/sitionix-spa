import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../../../../shared/http/httpClient";
import { createSite, getSites } from "../../../../features/workspace/api/sitesApi";

vi.mock("../../../../shared/http/httpClient", () => ({
  requestJson: vi.fn(),
}));

const requestJsonMock = vi.mocked(requestJson);

describe("sitesApi.createSite", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
  });

  it("sends mapped payload and returns created site id", async () => {
    // Given
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

    // When
    const result = await createSite({
      name: "  My Site  ",
      type: "business",
      description: "  Company website  ",
      template: "portfolio",
    });

    // Then
    expect(result).toEqual({ id: "site-123" });
    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/sites",
      body: {
        name: "My Site",
        type: "BUSINESS",
        description: "Company website",
        template: "PORTFOLIO",
      },
    });
  });

  it("throws when site name is blank", async () => {
    // When / Then
    await expect(createSite({ name: "   " })).rejects.toThrow("Site name is required");
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("throws api error when request fails", async () => {
    // Given
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

    // When / Then
    await expect(createSite({ name: "Site" })).rejects.toEqual(apiError);
  });

  it("throws when response does not include siteId", async () => {
    // Given
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

    // When / Then
    await expect(createSite({ name: "Site" })).rejects.toThrow(
      "Invalid create site response"
    );
  });
});

describe("sitesApi.getSites", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
  });

  it("calls sites endpoint with paging query and maps response", async () => {
    // Given
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
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
      },
    });

    // When
    const result = await getSites({ page: 0, size: 20, sortBy: "date" });

    // Then
    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/sites?sortBy=date&page=0&size=20",
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
    // Given
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

    // When / Then
    await expect(getSites({ page: 0, size: 20 })).rejects.toEqual(apiError);
  });
});
