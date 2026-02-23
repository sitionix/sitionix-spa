import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../../../../shared/http/httpClient";
import { createSite, getSites } from "../../../../features/workspace/api/sitesApi";

vi.mock("../../../../shared/http/httpClient", () => ({
  requestJson: vi.fn(),
}));

const requestJsonMock = vi.mocked(requestJson);

describe("sitesApi", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
  });

  it("creates site with mapped payload and without auth header", async () => {
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
      body: {
        name: "My Site",
        type: "BUSINESS",
        description: "Company website",
        template: "PORTFOLIO",
      },
    });
  });

  it("throws when site name is blank", async () => {
    await expect(createSite({ name: "   " })).rejects.toThrow("Site name is required");
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("throws backend error when create site request fails", async () => {
    const apiError = {
      code: 401,
      title: "Unauthorized",
      details: "Authentication required",
    };
    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: apiError,
    });

    await expect(createSite({ name: "Site" })).rejects.toEqual(apiError);
  });

  it("loads sites page and normalizes payload", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: [
          {
            siteId: "site-1",
            name: "Site 1",
            status: "DRAFT",
            type: "PORTFOLIO",
            description: null,
            createdAt: "2026-02-01T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
        ],
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    const result = await getSites({ page: 0, size: 20, search: "site" });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/sites?search=site&page=0&size=20",
    });
    expect(result.meta.totalItems).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: "site-1",
      name: "Site 1",
      status: "draft",
    });
  });
});
