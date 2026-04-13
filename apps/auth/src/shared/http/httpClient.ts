import { authSessionManager } from "@sitionix/auth-session";
import { Configuration } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable";
import { configureAuthSessionBridge, createRequestJson } from "@sitionix/http-client";
import { publicEnv } from "../env/publicEnv";

export type {
  HttpMethod,
  HttpRequestOptions,
  HttpResponse,
  HttpErrorResponse,
  HttpResult,
} from "@sitionix/http-client";

configureAuthSessionBridge({
  getAccessToken: () => authSessionManager.getAccessToken(),
  refresh: () => authSessionManager.refresh(),
});

export const requestJson = createRequestJson(publicEnv.apiBaseUrl);

const PUBLIC_AUTH_PATHS = new Set<string>([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/email/verify",
  "/api/v1/auth/email/verify/resend",
  "/api/v1/users",
]);

const REFRESH_PATH = "/api/v1/auth/refresh";

function extractPathname(url: string): string {
  try {
    return new URL(url, publicEnv.apiBaseUrl).pathname;
  } catch {
    return url;
  }
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !PUBLIC_AUTH_PATHS.has(pathname);
}

async function fetchWithAuthRetry(url: string, init: RequestInit): Promise<Response> {
  const firstAttempt = await fetch(url, {
    ...init,
    credentials: "include",
  });

  const pathname = extractPathname(url);
  const shouldRetry =
    firstAttempt.status === 401 &&
    isProtectedPath(pathname) &&
    pathname !== REFRESH_PATH;

  if (!shouldRetry) {
    return firstAttempt;
  }

  const refreshedAccessToken = await authSessionManager.refresh();
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
}

export const bffApiConfiguration = new Configuration({
  basePath: publicEnv.apiBaseUrl,
  credentials: "include",
  fetchApi: fetchWithAuthRetry,
  accessToken: async () => authSessionManager.getAccessToken() ?? "",
});
