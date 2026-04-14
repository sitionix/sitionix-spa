import { configureAuthSessionBridge, createRequestJson } from "@sitionix/http-client";

type SessionManagerLike = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
};

type BffConfigurationOptions = {
  basePath: string;
  credentials: "include";
  fetchApi: (url: string, init?: RequestInit) => Promise<Response>;
  accessToken: () => Promise<string>;
};

type BffHttpClient = {
  requestJson: ReturnType<typeof createRequestJson>;
  configuration: BffConfigurationOptions;
};

const PUBLIC_AUTH_PATHS = new Set<string>([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/email/verify",
  "/api/v1/auth/email/verify/resend",
  "/api/v1/users",
]);

const REFRESH_PATH = "/api/v1/auth/refresh";

const extractPathname = (url: string, baseUrl: string): string => {
  try {
    return new URL(url, baseUrl).pathname;
  } catch {
    return url;
  }
};

const isProtectedPath = (pathname: string): boolean =>
  pathname.startsWith("/api/") && !PUBLIC_AUTH_PATHS.has(pathname);

const createFetchWithAuthRetry = (
  baseUrl: string,
  sessionManager: SessionManagerLike
) => {
  return async (url: string, init: RequestInit = {}): Promise<Response> => {
    const firstAttempt = await fetch(url, {
      ...init,
      credentials: "include",
    });

    const pathname = extractPathname(url, baseUrl);
    const shouldRetry =
      firstAttempt.status === 401 &&
      isProtectedPath(pathname) &&
      pathname !== REFRESH_PATH;

    if (!shouldRetry) {
      return firstAttempt;
    }

    const refreshedAccessToken = await sessionManager.refresh();
    if (!refreshedAccessToken) {
      return firstAttempt;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedAccessToken}`);

    return fetch(url, {
      ...init,
      credentials: "include",
      headers: retryHeaders,
    });
  };
};

export const createBffHttpClient = (
  baseUrl: string,
  sessionManager: SessionManagerLike
): BffHttpClient => {
  configureAuthSessionBridge({
    getAccessToken: () => sessionManager.getAccessToken(),
    refresh: () => sessionManager.refresh(),
  });

  return {
    requestJson: createRequestJson(baseUrl),
    configuration: {
      basePath: baseUrl,
      credentials: "include",
      fetchApi: createFetchWithAuthRetry(baseUrl, sessionManager),
      accessToken: async () => sessionManager.getAccessToken() ?? "",
    },
  };
};

