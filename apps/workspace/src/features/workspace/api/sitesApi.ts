import { AUTH_TOKEN_STORAGE_KEYS, getOrCreateSessionSourceId } from "@sitionix/auth-session";
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

type TokenStorageSource = "session" | "local";

type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  source: TokenStorageSource;
};

export type GetSitesQuery = {
  search?: string;
  sortBy?: "date" | "name" | "edited";
  page?: number;
  size?: number;
};

type RefreshAccessTokenRequest = {
  refreshToken: string;
  sessionSourceId: string;
};

type RefreshAccessTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
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

let refreshPromise: Promise<StoredAuthTokens | null> | null = null;

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

const readTokensFromStorage = (
  storage: Storage,
  source: TokenStorageSource
): StoredAuthTokens | null => {
  const accessToken = storage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken)?.trim();
  const refreshToken = storage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken)?.trim();
  if (!accessToken || !refreshToken) {
    return null;
  }

  const tokenType =
    storage.getItem(AUTH_TOKEN_STORAGE_KEYS.tokenType)?.trim() || "Bearer";
  const expiresInRaw = storage.getItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn);
  const expiresIn = expiresInRaw ? Number.parseInt(expiresInRaw, 10) : Number.NaN;

  return {
    accessToken,
    refreshToken,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : 0,
    tokenType,
    source,
  };
};

const getStoredTokens = (): StoredAuthTokens | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    readTokensFromStorage(window.sessionStorage, "session") ??
    readTokensFromStorage(window.localStorage, "local")
  );
};

const toAuthorizationHeader = (tokens: Pick<StoredAuthTokens, "tokenType" | "accessToken">): string => {
  return `${tokens.tokenType || "Bearer"} ${tokens.accessToken}`;
};

const getStorageBySource = (source: TokenStorageSource): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return source === "session" ? window.sessionStorage : window.localStorage;
};

const persistTokens = (
  source: TokenStorageSource,
  tokens: RefreshAccessTokenResponse
): void => {
  const storage = getStorageBySource(source);
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, tokens.accessToken);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, tokens.refreshToken);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, String(tokens.expiresIn));
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, tokens.tokenType);
};

const clearStoredTokens = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  for (const storage of [window.sessionStorage, window.localStorage]) {
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.accessToken);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.tokenType);
  }
};

const refreshAccessTokenWithLock = async (
  tokens: StoredAuthTokens
): Promise<StoredAuthTokens | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const result = await requestJson<
        RefreshAccessTokenResponse,
        ApiError,
        RefreshAccessTokenRequest
      >({
        method: "POST",
        path: "/api/v1/auth/refresh",
        body: {
          refreshToken: tokens.refreshToken,
          sessionSourceId: getOrCreateSessionSourceId(),
        },
      });

      if (!result.ok) {
        clearStoredTokens();
        return null;
      }

      persistTokens(tokens.source, result.data);
      return {
        ...result.data,
        source: tokens.source,
      };
    } catch {
      clearStoredTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const requestJsonWithAuthRefresh = async <TSuccess, TBody>(
  options: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    body?: TBody;
  }
) => {
  const storedTokens = getStoredTokens();
  const firstAttempt = await requestJson<TSuccess, ApiError, TBody>({
    ...options,
    ...(storedTokens
      ? {
          headers: {
            Authorization: toAuthorizationHeader(storedTokens),
          },
        }
      : {}),
  });

  if (
    firstAttempt.ok ||
    firstAttempt.status !== 401 ||
    !storedTokens ||
    options.path === "/api/v1/auth/refresh"
  ) {
    return firstAttempt;
  }

  const refreshedTokens = await refreshAccessTokenWithLock(storedTokens);
  if (!refreshedTokens) {
    return firstAttempt;
  }

  return requestJson<TSuccess, ApiError, TBody>({
    ...options,
    headers: {
      Authorization: toAuthorizationHeader(refreshedTokens),
    },
  });
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
  const result = await requestJsonWithAuthRefresh<Page<WorkspaceSite>, undefined>({
    method: "GET",
    path: `/api/v1/sites${queryString ? `?${queryString}` : ""}`,
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

  const result = await requestJsonWithAuthRefresh<CreateSiteApiResponse, CreateSiteApiRequest>({
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
