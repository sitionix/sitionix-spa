import { AUTH_TOKEN_STORAGE_KEYS } from "@sitionix/auth-session";
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

const SITE_TYPE_TO_API: Record<NonNullable<CreateSiteRequest["type"]>, NonNullable<CreateSiteApiRequest["type"]>> = {
  portfolio: "PORTFOLIO",
  business: "BUSINESS",
  blog: "BLOG",
  store: "STORE",
  landing: "LANDING",
  other: "OTHER",
};

const SITE_TEMPLATE_TO_API: Record<NonNullable<CreateSiteRequest["template"]>, NonNullable<CreateSiteApiRequest["template"]>> = {
  blank: "BLANK",
  portfolio: "PORTFOLIO",
  business: "BUSINESS",
};

const readStoredTokenValue = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) {
    return sessionValue;
  }

  return window.localStorage.getItem(key);
};

const resolveAuthorizationHeader = (): string | null => {
  const accessToken = readStoredTokenValue(AUTH_TOKEN_STORAGE_KEYS.accessToken)?.trim();
  if (!accessToken) {
    return null;
  }

  const tokenType =
    readStoredTokenValue(AUTH_TOKEN_STORAGE_KEYS.tokenType)?.trim() || "Bearer";

  return `${tokenType} ${accessToken}`;
};

const withAuthorizationHeader = (): { headers: { Authorization: string } } | {} => {
  const authorizationHeader = resolveAuthorizationHeader();
  if (!authorizationHeader) {
    return {};
  }

  return {
    headers: {
      Authorization: authorizationHeader,
    },
  };
};

export async function getSites(
  query?: GetSitesQuery
): Promise<Page<WorkspaceSite>> {
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
  const result = await requestJson<Page<WorkspaceSite>, ApiError, undefined>({
    method: "GET",
    path: `/api/v1/workspace/sites${queryString ? `?${queryString}` : ""}`,
    ...withAuthorizationHeader(),
  });

  if (!result.ok) {
    throw result.error ?? new Error("Get sites request failed");
  }

  return result.data;
}

export async function createSite(
  payload: CreateSiteRequest
): Promise<CreateSiteResponse> {
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
    ...withAuthorizationHeader(),
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
