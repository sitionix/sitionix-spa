import type { ApiError } from "@sitionix/contracts";
import { requestJson } from "../../../shared/http/httpClient";
import type {
  LoginUserRequest,
  LoginUserResponse,
  LoginUserResult,
} from "../model/loginUserTypes";

export async function loginUserApi(
  request: LoginUserRequest,
  signal?: AbortSignal
): Promise<LoginUserResult> {
  const res = await requestJson<LoginUserResponse, ApiError, LoginUserRequest>({
    method: "POST",
    path: "/api/v1/auth/login",
    body: request,
    signal,
  });

  if (res.ok) {
    return { ok: true, data: res.data };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: {
        code: res.status,
        title: "Unauthorized",
        details: "Невірна пошта або пароль",
      },
    };
  }

  return { ok: false, error: res.error };
}
