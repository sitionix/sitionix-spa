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
} from "../model/workspaceTypes";
import type {
  RequestJsonFn,
  WorkspaceApi,
  WorkspaceSitesQuery,
} from "./workspaceApi";
import { getSiteOverview, getSites } from "./sitesApi";

const expectOk = <TSuccess, TError>(
  result: { ok: true; data: TSuccess } | { ok: false; error: TError }
): TSuccess => {
  if (result.ok) {
    return result.data;
  }

  throw result.error ?? new Error("Request failed");
};

export function createHttpWorkspaceApi(requestJson: RequestJsonFn): WorkspaceApi {
  return {
    async getDashboardSummary(): Promise<WorkspaceDashboardSummary> {
      const result = await requestJson<WorkspaceDashboardSummary, unknown, undefined>({
        method: "GET",
        path: "/api/v1/workspace/dashboard",
      });

      return expectOk(result);
    },

    async getSites(query?: WorkspaceSitesQuery): Promise<Page<WorkspaceSite>> {
      return getSites(query);
    },

    async getSiteOverview(siteId: string): Promise<WorkspaceSiteOverview> {
      return getSiteOverview(siteId);
    },

    async duplicateSite(siteId: string): Promise<WorkspaceSite> {
      const result = await requestJson<WorkspaceSite, unknown, undefined>({
        method: "POST",
        path: `/api/v1/workspace/sites/${siteId}/duplicate`,
      });

      return expectOk(result);
    },

    async deleteSite(siteId: string): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, undefined>({
        method: "DELETE",
        path: `/api/v1/workspace/sites/${siteId}`,
      });

      expectOk(result);
    },

    async restoreSite(siteId: string): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, undefined>({
        method: "POST",
        path: `/api/v1/workspace/trash/${siteId}/restore`,
      });

      expectOk(result);
    },

    async permanentlyDeleteSite(siteId: string): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, undefined>({
        method: "DELETE",
        path: `/api/v1/workspace/trash/${siteId}`,
      });

      expectOk(result);
    },

    async clearTrash(): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, undefined>({
        method: "DELETE",
        path: "/api/v1/workspace/trash",
      });

      expectOk(result);
    },

    async addToCollection(siteId: string, collectionId: string): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, { collectionId: string }>({
        method: "POST",
        path: `/api/v1/workspace/sites/${siteId}/collection`,
        body: { collectionId },
      });

      expectOk(result);
    },

    async removeFromCollection(siteId: string): Promise<void> {
      const result = await requestJson<{ ok: true }, unknown, undefined>({
        method: "DELETE",
        path: `/api/v1/workspace/sites/${siteId}/collection`,
      });

      expectOk(result);
    },

    async getCollections(): Promise<Page<WorkspaceCollection>> {
      const result = await requestJson<Page<WorkspaceCollection>, unknown, undefined>({
        method: "GET",
        path: "/api/v1/workspace/collections",
      });

      return expectOk(result);
    },

    async getDomains(): Promise<Page<WorkspaceDomain>> {
      const result = await requestJson<Page<WorkspaceDomain>, unknown, undefined>({
        method: "GET",
        path: "/api/v1/workspace/domains",
      });

      return expectOk(result);
    },

    async getTrash(): Promise<Page<WorkspaceTrashItem>> {
      const result = await requestJson<Page<WorkspaceTrashItem>, unknown, undefined>({
        method: "GET",
        path: "/api/v1/workspace/trash",
      });

      return expectOk(result);
    },

    async getCrmSummary(): Promise<WorkspaceCrmSummary> {
      const result = await requestJson<WorkspaceCrmSummary, unknown, undefined>({
        method: "GET",
        path: "/api/v1/workspace/crm",
      });

      return expectOk(result);
    },

    async getEditorData(siteId: string): Promise<WorkspaceEditorData> {
      const result = await requestJson<WorkspaceEditorData, unknown, undefined>({
        method: "GET",
        path: `/api/v1/workspace/editor/${siteId}`,
      });

      return expectOk(result);
    },
  };
}
