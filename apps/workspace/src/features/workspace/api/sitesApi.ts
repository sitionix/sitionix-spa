import { SiteApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-113-unstable/apis";
import type {
  CreateSiteRequestDTO,
  CreateSiteRequestDTOTemplateEnum,
  CreateSiteRequestDTOTypeEnum,
  SiteOverviewDTO,
  WorkspaceSiteCardResponseDTO,
  WorkspaceSitesResponseDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-113-unstable/models";
import { bffApiConfiguration } from "../../../shared/http/httpClient";
import type {
  Page,
  WorkspaceSite,
  WorkspaceSiteOverview,
} from "../model/workspaceTypes";

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
  type?: CreateSiteRequestDTOTypeEnum;
  description?: string;
  template?: CreateSiteRequestDTOTemplateEnum;
};
const siteApi = new SiteApi(bffApiConfiguration);

const SITE_TYPE_TO_API: Record<
  NonNullable<CreateSiteRequest["type"]>,
  CreateSiteRequestDTOTypeEnum
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
  CreateSiteRequestDTOTemplateEnum
> = {
  blank: "BLANK",
  portfolio: "BLANK",
  business: "BLANK",
};

const toWorkspaceSiteStatus = (value: string): WorkspaceSite["status"] =>
  value.toUpperCase() === "PUBLISHED" ? "published" : "draft";

const toWorkspaceSite = (item: WorkspaceSiteCardResponseDTO): WorkspaceSite => ({
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

const normalizeSitesPage = (
  response: WorkspaceSitesResponseDTO
): Page<WorkspaceSite> => {
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
  const response = await siteApi.getSites({
    ...(typeof query?.page === "number" ? { page: query.page } : {}),
    ...(typeof query?.size === "number" ? { size: query.size } : {}),
  });

  return normalizeSitesPage(response);
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

  const requestBody: CreateSiteRequestDTO = apiPayload;
  const response = await siteApi.createSite({
    createSiteRequestDTO: requestBody,
  });

  if (!response.siteId) {
    throw new Error("Invalid create site response");
  }

  return {
    id: response.siteId,
  };
}

const toWorkspaceSiteOverview = (item: SiteOverviewDTO): WorkspaceSiteOverview => ({
  siteId: item.siteId,
  name: item.name,
  status: toWorkspaceSiteStatus(item.status),
  type: "standalone",
  description: item.description ?? null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export async function getSiteOverview(siteId: string): Promise<WorkspaceSiteOverview> {
  const response = await siteApi.getSiteOverview({ siteId });
  return toWorkspaceSiteOverview(response);
}

export const sitesApi = {
  getSites,
  createSite,
  getSiteOverview,
};
