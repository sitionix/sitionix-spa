export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions<TBody> = {
  method: HttpMethod;
  path: string;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type HttpResponse<TSuccess> = {
  ok: true;
  status: number;
  data: TSuccess;
};

export type HttpErrorResponse<TError> = {
  ok: false;
  status: number;
  error: TError;
};

export type HttpResult<TSuccess, TError> =
  | HttpResponse<TSuccess>
  | HttpErrorResponse<TError>;

export type RequestJsonOptions<TBody> = HttpRequestOptions<TBody> & {
  baseUrl: string;
};

export type AuthSessionBridge = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
  isProtectedRequest?: (path: string, method: HttpMethod) => boolean;
};

const PUBLIC_AUTH_PATHS = new Set<string>([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/email/verify",
  "/api/v1/auth/email/verify/resend",
  "/api/v1/users",
]);

let authSessionBridge: AuthSessionBridge | null = null;

function normalizePath(path: string): string {
  const [withoutHash] = path.split("#", 1);
  const [withoutQuery] = withoutHash.split("?", 1);
  return withoutQuery || "/";
}

function isRefreshPath(path: string): boolean {
  return normalizePath(path) === "/api/v1/auth/refresh";
}

function isProtectedRequest(path: string, method: HttpMethod): boolean {
  const bridge = authSessionBridge;
  if (bridge?.isProtectedRequest) {
    return bridge.isProtectedRequest(path, method);
  }

  const normalized = normalizePath(path);
  return normalized.startsWith("/api/") && !PUBLIC_AUTH_PATHS.has(normalized);
}

async function parseHttpResult<TSuccess, TError>(
  response: Response
): Promise<HttpResult<TSuccess, TError>> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (response.ok) {
    const data = (isJson ? await response.json() : null) as TSuccess;
    return { ok: true, status: response.status, data };
  }

  const error = (isJson ? await response.json() : null) as TError;
  return { ok: false, status: response.status, error };
}

export function configureAuthSessionBridge(bridge: AuthSessionBridge | null): void {
  authSessionBridge = bridge;
}

export async function requestJson<TSuccess, TError, TBody>(
  options: RequestJsonOptions<TBody>
): Promise<HttpResult<TSuccess, TError>> {
  const bridge = authSessionBridge;
  const protectedRequest = isProtectedRequest(options.path, options.method);
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };
  const hasAuthorizationHeader = Object.keys(baseHeaders).some(
    (headerName) => headerName.toLowerCase() === "authorization"
  );
  const currentAccessToken =
    protectedRequest && bridge && !hasAuthorizationHeader
      ? bridge.getAccessToken()
      : null;

  const firstAttemptHeaders = {
    ...baseHeaders,
    ...(currentAccessToken
      ? { Authorization: `Bearer ${currentAccessToken}` }
      : {}),
  };

  const firstAttemptResponse = await fetch(`${options.baseUrl}${options.path}`, {
    method: options.method,
    credentials: "include",
    headers: firstAttemptHeaders,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const canRetryWithRefresh =
    firstAttemptResponse.status === 401 &&
    protectedRequest &&
    Boolean(bridge) &&
    !isRefreshPath(options.path);

  if (!canRetryWithRefresh || !bridge) {
    return parseHttpResult<TSuccess, TError>(firstAttemptResponse);
  }

  const refreshedAccessToken = await bridge.refresh();
  if (!refreshedAccessToken) {
    return parseHttpResult<TSuccess, TError>(firstAttemptResponse);
  }

  const retryHeaders = {
    ...baseHeaders,
    Authorization: `Bearer ${refreshedAccessToken}`,
  };

  const retryResponse = await fetch(`${options.baseUrl}${options.path}`, {
    method: options.method,
    credentials: "include",
    headers: retryHeaders,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  return parseHttpResult<TSuccess, TError>(retryResponse);
}

export function createRequestJson(baseUrl: string) {
  return async function requestJsonWithBase<TSuccess, TError, TBody>(
    options: HttpRequestOptions<TBody>
  ): Promise<HttpResult<TSuccess, TError>> {
    return requestJson<TSuccess, TError, TBody>({ baseUrl, ...options });
  };
}
