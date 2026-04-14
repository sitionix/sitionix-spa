import { describe, expect, it, vi } from "vitest";
import type {
  Page,
  WorkspaceCollection,
  WorkspaceCrmSummary,
  WorkspaceDashboardSummary,
  WorkspaceDomain,
  WorkspaceEditorData,
  WorkspaceSite,
  WorkspaceSiteOverview,
  WorkspaceTrashItem,
} from "../../../../features/workspace/model/workspaceTypes";
import { createHttpWorkspaceApi } from "../../../../features/workspace/api/workspaceHttpApi";
import { getSiteOverview, getSites } from "../../../../features/workspace/api/sitesApi";

vi.mock("../../../../features/workspace/api/sitesApi", () => ({
  getSites: vi.fn(),
  getSiteOverview: vi.fn(),
}));

const getSitesMock = vi.mocked(getSites);
const getSiteOverviewMock = vi.mocked(getSiteOverview);

const ok = <T>(data: T) => ({ ok: true as const, data });

const sampleSite: WorkspaceSite = {
  id: "site-1",
  name: "Site",
  domain: "site.example",
  type: "standalone",
  status: "published",
  createdAt: "2026-02-01T12:00:00.000Z",
  updatedAt: "2026-02-02T12:00:00.000Z",
  visits: 12,
  description: null,
  seoTitle: null,
  seoDescription: null,
  ecosystemName: null,
  collectionId: null,
  thumbnailUrl: null,
};

const sampleOverview: WorkspaceSiteOverview = {
  siteId: "site-1",
  name: "Site",
  type: "standalone",
  status: "published",
  createdAt: "2026-02-01T12:00:00.000Z",
  updatedAt: "2026-02-02T12:00:00.000Z",
  description: null,
};

const samplePage = <T,>(items: T[]): Page<T> => ({
  items,
  meta: { page: 1, size: items.length, totalItems: items.length, totalPages: 1 },
});

const sampleDashboard: WorkspaceDashboardSummary = {
  totalSites: 1,
  publishedSites: 1,
  totalVisits: 12,
  activeUsers: 4,
  recentSites: [
    {
      id: "site-1",
      name: "Site",
      domain: "site.example",
      visits: 12,
      updatedAt: "2026-02-02T12:00:00.000Z",
    },
  ],
};

const sampleCrm: WorkspaceCrmSummary = {
  overview: {
    totalViews: 120,
    totalViewsChangePct: 10,
    averageViewsPerSite: 120,
    averageViewsChangePct: 8,
    uniqueVisitors: 80,
    uniqueVisitorsChangePct: 5,
    averageSessionDurationSeconds: 165,
  },
  sitePerformance: [
    {
      siteId: "site-1",
      siteName: "Site",
      domain: "site.example",
      views: 120,
      uniqueVisitors: 80,
      bounceRatePct: 42,
      status: "published",
    },
  ],
  trafficSources: [{ source: "Direct", visits: 10, percentage: 50 }],
  topPages: [{ path: "/", views: 20 }],
};

const sampleEditor: WorkspaceEditorData = {
  palette: [{ id: "text", label: "Text" }],
  preview: {
    heroTitle: "Hero",
    heroSubtitle: "Subtitle",
    ctaLabel: "CTA",
    blocks: [{ id: "block", title: "Block", description: "Desc" }],
    footerText: "Footer",
  },
};

const sampleCollections: Page<WorkspaceCollection> = samplePage([
  { id: "col-1", name: "Collection", color: "blue", sitesCount: 1 },
]);

const sampleDomains: Page<WorkspaceDomain> = samplePage([
  { id: "dom-1", domain: "site.example", status: "active", expiresAt: "2026-12-31T00:00:00.000Z", siteId: "site-1" },
]);

const sampleTrash: Page<WorkspaceTrashItem> = samplePage([
  { ...sampleSite, deletedAt: "2026-02-05T12:00:00.000Z" },
]);

describe("createHttpWorkspaceApi", () => {
  it("calls expected endpoints", async () => {
    getSitesMock.mockResolvedValue(samplePage([sampleSite]));
    getSiteOverviewMock.mockResolvedValue(sampleOverview);

    const requestJson = vi
      .fn()
      .mockResolvedValueOnce(ok(sampleDashboard))
      .mockResolvedValueOnce(ok(sampleSite))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok({ ok: true }))
      .mockResolvedValueOnce(ok(sampleCollections))
      .mockResolvedValueOnce(ok(sampleDomains))
      .mockResolvedValueOnce(ok(sampleTrash))
      .mockResolvedValueOnce(ok(sampleCrm))
      .mockResolvedValueOnce(ok(sampleEditor));

    const api = createHttpWorkspaceApi(requestJson);

    await api.getDashboardSummary();
    await api.getSites({ search: "site", sortBy: "name", page: 2, size: 5 });
    await api.getSiteOverview("site-1");
    await api.duplicateSite("site-1");
    await api.deleteSite("site-1");
    await api.restoreSite("site-1");
    await api.permanentlyDeleteSite("site-1");
    await api.clearTrash();
    await api.addToCollection("site-1", "col-1");
    await api.removeFromCollection("site-1");
    await api.getCollections();
    await api.getDomains();
    await api.getTrash();
    await api.getCrmSummary();
    await api.getEditorData("site-1");

    expect(requestJson).toHaveBeenNthCalledWith(1, {
      method: "GET",
      path: "/api/v1/workspace/dashboard",
    });

    expect(getSitesMock).toHaveBeenCalledWith({
      search: "site",
      sortBy: "name",
      page: 2,
      size: 5,
    });
    expect(getSiteOverviewMock).toHaveBeenCalledWith("site-1");

    expect(requestJson).toHaveBeenNthCalledWith(2, {
      method: "POST",
      path: "/api/v1/workspace/sites/site-1/duplicate",
    });

    expect(requestJson).toHaveBeenNthCalledWith(3, {
      method: "DELETE",
      path: "/api/v1/workspace/sites/site-1",
    });

    expect(requestJson).toHaveBeenNthCalledWith(4, {
      method: "POST",
      path: "/api/v1/workspace/trash/site-1/restore",
    });

    expect(requestJson).toHaveBeenNthCalledWith(5, {
      method: "DELETE",
      path: "/api/v1/workspace/trash/site-1",
    });

    expect(requestJson).toHaveBeenNthCalledWith(6, {
      method: "DELETE",
      path: "/api/v1/workspace/trash",
    });

    expect(requestJson).toHaveBeenNthCalledWith(7, {
      method: "POST",
      path: "/api/v1/workspace/sites/site-1/collection",
      body: { collectionId: "col-1" },
    });

    expect(requestJson).toHaveBeenNthCalledWith(8, {
      method: "DELETE",
      path: "/api/v1/workspace/sites/site-1/collection",
    });

    expect(requestJson).toHaveBeenNthCalledWith(9, {
      method: "GET",
      path: "/api/v1/workspace/collections",
    });

    expect(requestJson).toHaveBeenNthCalledWith(10, {
      method: "GET",
      path: "/api/v1/workspace/domains",
    });

    expect(requestJson).toHaveBeenNthCalledWith(11, {
      method: "GET",
      path: "/api/v1/workspace/trash",
    });

    expect(requestJson).toHaveBeenNthCalledWith(12, {
      method: "GET",
      path: "/api/v1/workspace/crm",
    });

    expect(requestJson).toHaveBeenNthCalledWith(13, {
      method: "GET",
      path: "/api/v1/workspace/editor/site-1",
    });
  });

  it("throws when request fails", async () => {
    const requestJson = vi.fn().mockResolvedValue({ ok: false, error: new Error("fail") });
    const api = createHttpWorkspaceApi(requestJson);

    await expect(api.getDashboardSummary()).rejects.toThrow("fail");
  });
});
