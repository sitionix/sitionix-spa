import { publicEnv } from "../env/publicEnv";

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

export async function requestJson<TSuccess, TError, TBody>(
  options: HttpRequestOptions<TBody>
): Promise<HttpResult<TSuccess, TError>> {
  const res = await fetch(`${publicEnv.apiBaseUrl}${options.path}`, {
    method: options.method,
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
