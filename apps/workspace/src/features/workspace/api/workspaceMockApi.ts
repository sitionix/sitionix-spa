import type {
  Page,
  WorkspaceCrmSummary,
  WorkspaceDashboardSummary,
  WorkspaceEditorData,
  WorkspaceSite,
  WorkspaceTrashItem,
} from "@sitionix/contracts";
import type { WorkspaceApi, WorkspaceSiteUpdatePayload, WorkspaceSitesQuery } from "./workspaceApi";
import { createEditorData, createMockWorkspaceState } from "./workspaceMockData";

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const paginate = <T>(items: T[], page = 1, size = items.length): Page<T> => {
  const safeSize = size > 0 ? size : items.length;
  const safePage = page > 0 ? page : 1;
  const start = (safePage - 1) * safeSize;
  const paged = items.slice(start, start + safeSize);
  const totalItems = items.length;
  const totalPages = safeSize === 0 ? 1 : Math.ceil(totalItems / safeSize);

  return {
    items: paged,
    meta: {
      page: safePage,
      size: safeSize,
      totalItems,
      totalPages,
    },
  };
};

const toComparable = (value: string) => value.trim().toLowerCase();

const sortByQuery = (sites: WorkspaceSite[], sortBy?: WorkspaceSitesQuery["sortBy"]) => {
  if (!sortBy || sortBy === "date") {
    return [...sites].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }

  if (sortBy === "name") {
    return [...sites].sort((a, b) => a.name.localeCompare(b.name, "uk-UA"));
  }

  return [...sites].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );
};

const syncCollectionCounts = (state: ReturnType<typeof createMockWorkspaceState>) => {
  const counts = new Map<string, number>();
  state.sites.forEach((site) => {
    if (site.collectionId) {
      counts.set(site.collectionId, (counts.get(site.collectionId) ?? 0) + 1);
    }
  });

  state.collections = state.collections.map((collection) => ({
    ...collection,
    sitesCount: counts.get(collection.id) ?? 0,
  }));
};

const buildDashboardSummary = (
  sites: WorkspaceSite[]
): WorkspaceDashboardSummary => {
  const totalSites = sites.length;
  const publishedSites = sites.filter((site) => site.status === "published").length;
  const totalVisits = sites.reduce((sum, site) => sum + site.visits, 0);
  const activeUsers = Math.max(150, Math.round(totalVisits * 0.35));

  const recentSites = [...sites]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5)
    .map((site) => ({
      id: site.id,
      name: site.name,
      domain: site.domain,
      visits: site.visits,
      updatedAt: site.updatedAt,
    }));

  return {
    totalSites,
    publishedSites,
    totalVisits,
    activeUsers,
    recentSites,
  };
};

const buildCrmSummary = (sites: WorkspaceSite[]): WorkspaceCrmSummary => {
  const totalViews = sites.reduce((sum, site) => sum + site.visits, 0);
  const averageViewsPerSite = sites.length
    ? Math.round(totalViews / sites.length)
    : 0;

  const trafficSources = [
    { source: "Органічний пошук", visits: 4234, percentage: 45 },
    { source: "Прямі заходи", visits: 2876, percentage: 30 },
    { source: "Соціальні мережі", visits: 1567, percentage: 17 },
    { source: "Реферальні посилання", visits: 756, percentage: 8 },
  ];

  const topPages = [
    { path: "/", views: 3456 },
    { path: "/about", views: 1234 },
    { path: "/products", views: 987 },
    { path: "/contact", views: 654 },
    { path: "/blog", views: 432 },
  ];

  const sitePerformance = sites.map((site) => {
    const hash = Array.from(site.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const bounceRatePct = 30 + (hash % 41);
    return {
      siteId: site.id,
      siteName: site.name,
      domain: site.domain,
      views: site.visits,
      uniqueVisitors: Math.round(site.visits * 0.7),
      bounceRatePct,
      status: site.status,
    };
  });

  return {
    overview: {
      totalViews,
      totalViewsChangePct: 12,
      averageViewsPerSite,
      averageViewsChangePct: 8,
      uniqueVisitors: Math.round(totalViews * 0.68),
      uniqueVisitorsChangePct: 5,
      averageSessionDurationSeconds: 165,
    },
    sitePerformance,
    trafficSources,
    topPages,
  };
};

export function createMockWorkspaceApi(): WorkspaceApi {
  const state = createMockWorkspaceState();

  return {
    async getDashboardSummary() {
      return buildDashboardSummary(state.sites);
    },

    async getSites(query?: WorkspaceSitesQuery) {
      const filtered = query?.search
        ? state.sites.filter((site) => {
            const term = toComparable(query.search ?? "");
            return (
              toComparable(site.name).includes(term) ||
              toComparable(site.domain).includes(term)
            );
          })
        : state.sites;

      const sorted = sortByQuery(filtered, query?.sortBy);
      return paginate(sorted, query?.page, query?.size);
    },

    async getSite(siteId: string) {
      const site = state.sites.find((item) => item.id === siteId);
      if (!site) {
        throw new Error("Site not found");
      }
      return site;
    },

    async updateSite(siteId: string, payload: WorkspaceSiteUpdatePayload) {
      const index = state.sites.findIndex((item) => item.id === siteId);
      if (index === -1) {
        throw new Error("Site not found");
      }

      state.sites[index] = {
        ...state.sites[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      state.editorBySiteId[siteId] = createEditorData(state.sites[index]);

      return state.sites[index];
    },

    async duplicateSite(siteId: string) {
      const site = state.sites.find((item) => item.id === siteId);
      if (!site) {
        throw new Error("Site not found");
      }

      const now = new Date().toISOString();
      const duplicate: WorkspaceSite = {
        ...site,
        id: createId("site"),
        name: `Копія ${site.name}`,
        domain: `copy-${site.domain}`,
        status: "draft",
        visits: 0,
        createdAt: now,
        updatedAt: now,
      };

      state.sites = [duplicate, ...state.sites];
      state.editorBySiteId[duplicate.id] = createEditorData(duplicate);
      syncCollectionCounts(state);
      return duplicate;
    },

    async deleteSite(siteId: string) {
      const site = state.sites.find((item) => item.id === siteId);
      if (!site) {
        throw new Error("Site not found");
      }

      state.sites = state.sites.filter((item) => item.id !== siteId);
      const trashed: WorkspaceTrashItem = {
        ...site,
        deletedAt: new Date().toISOString(),
      };
      state.trash = [trashed, ...state.trash];
      syncCollectionCounts(state);
    },

    async restoreSite(siteId: string) {
      const item = state.trash.find((trashItem) => trashItem.id === siteId);
      if (!item) {
        throw new Error("Trashed site not found");
      }

      const { deletedAt, ...restored } = item;
      state.trash = state.trash.filter((trashItem) => trashItem.id !== siteId);
      state.sites = [restored, ...state.sites];
      state.editorBySiteId[restored.id] = createEditorData(restored);
      syncCollectionCounts(state);
    },

    async permanentlyDeleteSite(siteId: string) {
      state.trash = state.trash.filter((item) => item.id !== siteId);
    },

    async clearTrash() {
      state.trash = [];
    },

    async addToCollection(siteId: string, collectionId: string) {
      const index = state.sites.findIndex((item) => item.id === siteId);
      if (index === -1) {
        throw new Error("Site not found");
      }
      if (!state.collections.some((collection) => collection.id === collectionId)) {
        throw new Error("Collection not found");
      }
      state.sites[index] = { ...state.sites[index], collectionId };
      syncCollectionCounts(state);
    },

    async removeFromCollection(siteId: string) {
      const index = state.sites.findIndex((item) => item.id === siteId);
      if (index === -1) {
        throw new Error("Site not found");
      }
      state.sites[index] = { ...state.sites[index], collectionId: null };
      syncCollectionCounts(state);
    },

    async getCollections() {
      return paginate([...state.collections].sort((a, b) => a.name.localeCompare(b.name, "uk-UA")));
    },

    async getDomains() {
      return paginate([...state.domains]);
    },

    async getTrash() {
      const sorted = [...state.trash].sort(
        (a, b) => Date.parse(b.deletedAt) - Date.parse(a.deletedAt)
      );
      return paginate(sorted);
    },

    async getCrmSummary() {
      return buildCrmSummary(state.sites);
    },

    async getEditorData(siteId: string): Promise<WorkspaceEditorData> {
      const existing = state.editorBySiteId[siteId];
      if (existing) {
        return existing;
      }

      const site = state.sites.find((item) => item.id === siteId);
      if (!site) {
        throw new Error("Editor data not found");
      }

      const created = createEditorData(site);
      state.editorBySiteId[siteId] = created;
      return created;
    },
  };
}
