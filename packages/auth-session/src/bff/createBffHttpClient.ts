export type SessionManagerLike = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
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

export const createBffFetchWithAuthRetry = (
  baseUrl: string,
  sessionManager: SessionManagerLike
) => async (url: string, init: RequestInit = {}): Promise<Response> => {
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
