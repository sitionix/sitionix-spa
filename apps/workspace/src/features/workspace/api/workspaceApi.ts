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
import type { HttpRequestOptions, HttpResult } from "@sitionix/http-client";
import { createRequestJson } from "@sitionix/http-client";
import { createHttpWorkspaceApi } from "./workspaceHttpApi";
import { createMockWorkspaceApi } from "./workspaceMockApi";

export type WorkspaceSitesQuery = {
  search?: string;
  sortBy?: "date" | "name" | "edited";
  page?: number;
  size?: number;
};

export type WorkspaceSiteUpdatePayload = Partial<
  Pick<WorkspaceSite, "name" | "domain" | "description" | "seoTitle" | "seoDescription">
>;

export type RequestJsonFn = <TSuccess, TError, TBody>(
  options: HttpRequestOptions<TBody>
) => Promise<HttpResult<TSuccess, TError>>;

export type WorkspaceApi = {
  getDashboardSummary: () => Promise<WorkspaceDashboardSummary>;
  getSites: (query?: WorkspaceSitesQuery) => Promise<Page<WorkspaceSite>>;
  getSite: (siteId: string) => Promise<WorkspaceSite>;
  updateSite: (
    siteId: string,
    payload: WorkspaceSiteUpdatePayload
  ) => Promise<WorkspaceSite>;
  duplicateSite: (siteId: string) => Promise<WorkspaceSite>;
  deleteSite: (siteId: string) => Promise<void>;
  restoreSite: (siteId: string) => Promise<void>;
  permanentlyDeleteSite: (siteId: string) => Promise<void>;
  clearTrash: () => Promise<void>;
  addToCollection: (siteId: string, collectionId: string) => Promise<void>;
  removeFromCollection: (siteId: string) => Promise<void>;
  getCollections: () => Promise<Page<WorkspaceCollection>>;
  getDomains: () => Promise<Page<WorkspaceDomain>>;
  getTrash: () => Promise<Page<WorkspaceTrashItem>>;
  getCrmSummary: () => Promise<WorkspaceCrmSummary>;
  getEditorData: (siteId: string) => Promise<WorkspaceEditorData>;
};

export type WorkspaceApiMode = "mock" | "http";

export type WorkspaceApiOptions = {
  mode: WorkspaceApiMode;
  baseUrl?: string;
  requestJson?: RequestJsonFn;
};

export function createWorkspaceApi(options: WorkspaceApiOptions): WorkspaceApi {
  if (options.mode === "http") {
    const requestJson =
      options.requestJson ??
      createRequestJson(options.baseUrl ?? "");

    return createHttpWorkspaceApi(requestJson);
  }

  return createMockWorkspaceApi();
}
