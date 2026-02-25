import type { ApiError, Page, WorkspaceSite } from "@sitionix/contracts";
import { requestJson } from "../../../shared/http/httpClient";

export type CreateSiteRequest = {
  name: string;
  type?: "portfolio" | "business" | "blog" | "store" | "landing" | "other";
  description?: string;
  template?: "blank" | "portfolio" | "business";
};

export type CreateSiteResponse = {
  id: string;
};

export type GetSitesQuery = {
  search?: string;
  sortBy?: "date" | "name" | "edited";
  page?: number;
  size?: number;
};

type CreateSiteApiRequest = {
  name: string;
  type?: "PORTFOLIO" | "BUSINESS" | "BLOG" | "STORE" | "LANDING" | "OTHER";
  description?: string;
  template?: "BLANK" | "PORTFOLIO" | "BUSINESS";
};

type CreateSiteApiResponse = {
  siteId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type GetSitesApiItem = {
  siteId: string;
  name: string;
  status: string;
  type: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

type GetSitesApiResponse = {
  items: GetSitesApiItem[];
  page: number;
  size: number;
  hasNext: boolean;
};

const SITE_TYPE_TO_API: Record<
  NonNullable<CreateSiteRequest["type"]>,
  NonNullable<CreateSiteApiRequest["type"]>
> = {
  portfolio: "PORTFOLIO",
  business: "BUSINESS",
  blog: "BLOG",
  store: "STORE",
  landing: "LANDING",
  other: "OTHER",
};

const SITE_TEMPLATE_TO_API: Record<
  NonNullable<CreateSiteRequest["template"]>,
  NonNullable<CreateSiteApiRequest["template"]>
> = {
  blank: "BLANK",
  portfolio: "PORTFOLIO",
  business: "BUSINESS",
};

const toWorkspaceSiteStatus = (value: string): WorkspaceSite["status"] =>
  value.toUpperCase() === "PUBLISHED" ? "published" : "draft";

const toWorkspaceSite = (item: GetSitesApiItem): WorkspaceSite => ({
  id: item.siteId,
  name: item.name,
  domain: "",
  description: item.description ?? null,
  seoTitle: null,
  seoDescription: null,
  type: "standalone",
  ecosystemName: null,
  collectionId: null,
  status: toWorkspaceSiteStatus(item.status),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  visits: 0,
  thumbnailUrl: null,
});

const normalizeSitesPage = (response: GetSitesApiResponse): Page<WorkspaceSite> => {
  const page = Number.isFinite(response.page) ? Math.max(0, response.page) : 0;
  const size = Number.isFinite(response.size) ? Math.max(1, response.size) : 20;
  const hasNext = Boolean(response.hasNext);
  const items = response.items
    .filter((item) => typeof item.siteId === "string" && item.siteId.length > 0)
    .map(toWorkspaceSite);

  const totalPages = hasNext ? page + 2 : page + 1;
  const totalItems = hasNext ? (page + 1) * size + 1 : page * size + items.length;

  return {
    items,
    meta: {
      page,
      size,
      totalItems,
      totalPages,
    },
  };
};

export async function getSites(query?: GetSitesQuery): Promise<Page<WorkspaceSite>> {
  const params = new URLSearchParams();
  if (query?.search) {
    params.set("search", query.search);
  }
  if (query?.sortBy) {
    params.set("sortBy", query.sortBy);
  }
  if (typeof query?.page === "number") {
    params.set("page", query.page.toString());
  }
  if (typeof query?.size === "number") {
    params.set("size", query.size.toString());
  }

  const queryString = params.toString();
  const result = await requestJson<GetSitesApiResponse, ApiError, undefined>({
    method: "GET",
    path: `/api/v1/sites${queryString ? `?${queryString}` : ""}`,
  });

  if (!result.ok) {
    throw result.error ?? new Error("Get sites request failed");
  }

  return normalizeSitesPage(result.data);
}

export async function createSite(payload: CreateSiteRequest): Promise<CreateSiteResponse> {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Site name is required");
  }

  const apiPayload: CreateSiteApiRequest = {
    name,
    ...(payload.type ? { type: SITE_TYPE_TO_API[payload.type] } : {}),
    ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
    ...(payload.template ? { template: SITE_TEMPLATE_TO_API[payload.template] } : {}),
  };

  const result = await requestJson<CreateSiteApiResponse, ApiError, CreateSiteApiRequest>({
    method: "POST",
    path: "/api/v1/sites",
    body: apiPayload,
  });

  if (!result.ok) {
    throw result.error ?? new Error("Create site request failed");
  }

  if (!result.data.siteId) {
    throw new Error("Invalid create site response");
  }

  return {
    id: result.data.siteId,
  };
}

export const sitesApi = {
  getSites,
  createSite,
};
