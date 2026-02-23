export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions<TBody> = {
  method: HttpMethod;
  path: string;
  body?: TBody;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
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

export async function requestJson<TSuccess, TError, TBody>(
  options: RequestJsonOptions<TBody>
): Promise<HttpResult<TSuccess, TError>> {
  const res = await fetch(`${options.baseUrl}${options.path}`, {
    method: options.method,
    credentials: options.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (res.ok) {
    const data = (isJson ? await res.json() : null) as TSuccess;
    return { ok: true, status: res.status, data };
  }

  const error = (isJson ? await res.json() : null) as TError;
  return { ok: false, status: res.status, error };
}

export function createRequestJson(baseUrl: string) {
  return async function requestJsonWithBase<TSuccess, TError, TBody>(
    options: HttpRequestOptions<TBody>
  ): Promise<HttpResult<TSuccess, TError>> {
    return requestJson<TSuccess, TError, TBody>({ baseUrl, ...options });
  };
}
