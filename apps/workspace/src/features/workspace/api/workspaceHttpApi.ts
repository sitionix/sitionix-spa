import type {
  Page,
  WorkspaceCollection,
  WorkspaceCrmSummary,
  WorkspaceDashboardSummary,
  WorkspaceDomain,
  WorkspaceEditorData,
  WorkspaceSite,
  WorkspaceTrashItem,
} from "@sitionix/contracts";
import type {
  RequestJsonFn,
  WorkspaceApi,
  WorkspaceSiteUpdatePayload,
  WorkspaceSitesQuery,
} from "./workspaceApi";

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
      const params = new URLSearchParams();
      if (query?.search) {
        params.set("search", query.search);
      }
      if (query?.sortBy) {
        params.set("sortBy", query.sortBy);
      }
      if (query?.page) {
        params.set("page", query.page.toString());
      }
      if (query?.size) {
        params.set("size", query.size.toString());
      }

      const queryString = params.toString();
      const result = await requestJson<Page<WorkspaceSite>, unknown, undefined>({
        method: "GET",
        path: `/api/v1/workspace/sites${queryString ? `?${queryString}` : ""}`,
      });

      return expectOk(result);
    },

    async getSite(siteId: string): Promise<WorkspaceSite> {
      const result = await requestJson<WorkspaceSite, unknown, undefined>({
        method: "GET",
        path: `/api/v1/workspace/sites/${siteId}`,
      });

      return expectOk(result);
    },

    async updateSite(
      siteId: string,
      payload: WorkspaceSiteUpdatePayload
    ): Promise<WorkspaceSite> {
      const result = await requestJson<WorkspaceSite, unknown, WorkspaceSiteUpdatePayload>({
        method: "PATCH",
        path: `/api/v1/workspace/sites/${siteId}`,
        body: payload,
      });

      return expectOk(result);
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
