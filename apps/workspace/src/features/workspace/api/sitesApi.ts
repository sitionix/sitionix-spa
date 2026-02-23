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

const refreshPromisesBySource: Record<TokenStorageSource, Promise<StoredAuthTokens | null> | null> = {
  session: null,
  local: null,
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

const toWorkspaceSiteStatus = (
  value: string
): WorkspaceSite["status"] => (value.toUpperCase() === "PUBLISHED" ? "published" : "draft");

const toWorkspaceSite = (item: GetSitesApiItem): WorkspaceSite => {
  return {
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
  };
};

const normalizeSitesPage = (response: GetSitesApiResponse): Page<WorkspaceSite> => {
  const page = Number.isFinite(response.page) ? Math.max(0, response.page) : 0;
  const size = Number.isFinite(response.size) ? Math.max(1, response.size) : 20;
  const hasNext = Boolean(response.hasNext);
  const items = response.items
    .filter((item) => typeof item.siteId === "string" && item.siteId.length > 0)
    .map(toWorkspaceSite);

  const totalPages = hasNext ? page + 2 : page + 1;
  const totalItems = hasNext
    ? (page + 1) * size + 1
    : page * size + items.length;

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

const getStoredTokens = (): StoredAuthTokens[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const sessionTokens = readTokensFromStorage(window.sessionStorage, "session");
  const localTokens = readTokensFromStorage(window.localStorage, "local");

  return [sessionTokens, localTokens].filter(
    (tokens): tokens is StoredAuthTokens => tokens !== null
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

const clearStoredTokens = (source?: TokenStorageSource): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storages = source
    ? [getStorageBySource(source)].filter((value): value is Storage => value !== null)
    : [window.sessionStorage, window.localStorage];

  for (const storage of storages) {
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.accessToken);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn);
    storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.tokenType);
  }
};

const refreshAccessTokenWithLock = async (
  tokens: StoredAuthTokens
): Promise<StoredAuthTokens | null> => {
  const activeRefreshPromise = refreshPromisesBySource[tokens.source];
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const refreshPromise = (async () => {
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
        clearStoredTokens(tokens.source);
        return null;
      }

      persistTokens(tokens.source, result.data);
      return {
        ...result.data,
        source: tokens.source,
      };
    } catch {
      clearStoredTokens(tokens.source);
      return null;
    } finally {
      refreshPromisesBySource[tokens.source] = null;
    }
  })();

  refreshPromisesBySource[tokens.source] = refreshPromise;
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
  if (storedTokens.length === 0) {
    return requestJson<TSuccess, ApiError, TBody>(options);
  }

  let lastUnauthorizedResult: {
    ok: false;
    status: number;
    error: ApiError;
  } | null = null;

  for (const tokens of storedTokens) {
    const firstAttempt = await requestJson<TSuccess, ApiError, TBody>({
      ...options,
      headers: {
        Authorization: toAuthorizationHeader(tokens),
      },
    });

    if (
      firstAttempt.ok ||
      firstAttempt.status !== 401 ||
      options.path === "/api/v1/auth/refresh"
    ) {
      return firstAttempt;
    }

    const refreshedTokens = await refreshAccessTokenWithLock(tokens);
    if (!refreshedTokens) {
      lastUnauthorizedResult = firstAttempt;
      continue;
    }

    const retryAttempt = await requestJson<TSuccess, ApiError, TBody>({
      ...options,
      headers: {
        Authorization: toAuthorizationHeader(refreshedTokens),
      },
    });

    if (retryAttempt.ok || retryAttempt.status !== 401) {
      return retryAttempt;
    }

    lastUnauthorizedResult = retryAttempt;
  }

  return lastUnauthorizedResult as {
    ok: false;
    status: number;
    error: ApiError;
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
  const result = await requestJsonWithAuthRefresh<GetSitesApiResponse, undefined>({
    method: "GET",
    path: `/api/v1/sites${queryString ? `?${queryString}` : ""}`,
  });

  if (!result.ok) {
    throw result.error ?? new Error("Get sites request failed");
  }

  return normalizeSitesPage(result.data);
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
