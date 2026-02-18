import { AUTH_TOKEN_STORAGE_KEYS } from "@sitionix/auth-session";
import type { ApiError } from "@sitionix/contracts";
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

  const localValue = window.localStorage.getItem(key);
  if (localValue) {
    return localValue;
  }

  return window.sessionStorage.getItem(key);
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

  const authorizationHeader = resolveAuthorizationHeader();

  const result = await requestJson<CreateSiteApiResponse, ApiError, CreateSiteApiRequest>({
    method: "POST",
    path: "/api/v1/sites",
    body: apiPayload,
    ...(authorizationHeader
      ? {
          headers: {
            Authorization: authorizationHeader,
          },
        }
      : {}),
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
  createSite,
};
