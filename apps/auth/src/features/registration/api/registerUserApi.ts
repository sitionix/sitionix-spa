import type { RegisterUserRequest, RegisterUserResponse, ApiError } from "@sitionix/contracts";
import type { RegisterUserResult } from "../model/registerUserTypes";
import { requestJson } from "../../../shared/http/httpClient";

export async function registerUserApi(
  request: RegisterUserRequest,
  signal?: AbortSignal
): Promise<RegisterUserResult> {
  const res = await requestJson<RegisterUserResponse, ApiError, RegisterUserRequest>({
    method: "POST",
    path: "/api/v1/users",
    body: request,
    signal,
  });

  if (res.ok) {
    return { ok: true, data: res.data };
  }

  return { ok: false, error: res.error };
}
