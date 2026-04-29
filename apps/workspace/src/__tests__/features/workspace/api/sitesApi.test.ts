import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-126-unstable/apis";
import { createSite, getSiteOverview, getSites } from "../../../../features/workspace/api/sitesApi";

describe("sitesApi.createSite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends mapped payload and returns created site id", async () => {
    const createSiteSpy = vi.spyOn(SiteApi.prototype, "createSite").mockResolvedValue({
      siteId: "site-123",
      name: "My Site",
      status: "DRAFT",
      createdAt: "2026-02-18T00:00:00.000Z",
      updatedAt: "2026-02-18T00:00:00.000Z",
    });

    const result = await createSite({
      name: "  My Site  ",
      type: "business",
      description: "  Company website  ",
      template: "portfolio",
    });

    expect(result).toEqual({ id: "site-123" });
    expect(createSiteSpy).toHaveBeenCalledWith({
      createSiteRequestDTO: {
        name: "My Site",
        type: "BUSINESS",
        description: "Company website",
        template: "BLANK",
      },
    });
  });

  it("throws when site name is blank", async () => {
    await expect(createSite({ name: "   " })).rejects.toThrow("Site name is required");
  });

  it("throws when response does not include siteId", async () => {
    vi.spyOn(SiteApi.prototype, "createSite").mockResolvedValue({
      siteId: "",
      name: "Site",
      status: "DRAFT",
      createdAt: "2026-02-18T00:00:00.000Z",
      updatedAt: "2026-02-18T00:00:00.000Z",
    });

    await expect(createSite({ name: "Site" })).rejects.toThrow(
      "Invalid create site response"
    );
  });
});

describe("sitesApi.getSites", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls sites endpoint with paging query and maps response", async () => {
    const getSitesSpy = vi.spyOn(SiteApi.prototype, "getSites").mockResolvedValue({
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
    });

    const result = await getSites({ page: 0, size: 20, sortBy: "date" });

    expect(getSitesSpy).toHaveBeenCalledWith({
      page: 0,
      size: 20,
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
});

describe("sitesApi.getSiteOverview", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps site overview payload", async () => {
    const getSiteOverviewSpy = vi
      .spyOn(SiteApi.prototype, "getSiteOverview")
      .mockResolvedValue({
        siteId: "site-1",
        name: "Alpha",
        status: "PUBLISHED",
        type: "BUSINESS",
        description: "Company site",
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T01:00:00.000Z",
      });

    const result = await getSiteOverview("site-1");

    expect(getSiteOverviewSpy).toHaveBeenCalledWith({ siteId: "site-1" });
    expect(result).toEqual({
      siteId: "site-1",
      name: "Alpha",
      status: "published",
      type: "standalone",
      description: "Company site",
      createdAt: "2026-02-18T00:00:00.000Z",
      updatedAt: "2026-02-18T01:00:00.000Z",
    });
  });
});
