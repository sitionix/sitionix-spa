import { AuthApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";
import type { ErrorDTO } from "@sitionix/app-afesox-bffssox-frontend-stable/models";
import { ResponseError } from "@sitionix/app-afesox-bffssox-frontend-stable";
import { bffApiConfiguration } from "../../../shared/http/httpClient";
import type {
  LoginUserRequest,
  LoginUserResult,
} from "../model/loginUserTypes";

const authApi = new AuthApi(bffApiConfiguration);

const unauthorizedError = (code: number): ErrorDTO => ({
  code,
  title: "Unauthorized",
  details: "Невірна пошта або пароль",
});

const parseError = async (error: unknown): Promise<{ status: number; error: ErrorDTO }> => {
  if (error instanceof ResponseError) {
    const status = error.response.status;
    const payload = (await error.response.clone().json().catch(() => null)) as
      | ErrorDTO
      | null;

    return {
      status,
      error:
        payload ??
        ({
          code: status,
          title: "Request failed",
          details: "Login request failed",
        } satisfies ErrorDTO),
    };
  }

  return {
    status: 0,
    error: {
      code: 0,
      title: "Request failed",
      details: "Login request failed",
    },
  };
};

export async function loginUserApi(
  request: LoginUserRequest,
  signal?: AbortSignal
): Promise<LoginUserResult> {
  try {
    const response = await authApi.login(
      { loginRequestDTO: request },
      signal ? { signal } : undefined
    );
    return { ok: true, data: response };
  } catch (error) {
    const parsed = await parseError(error);
    if (parsed.status === 401 || parsed.status === 403) {
      return { ok: false, error: unauthorizedError(parsed.status) };
    }

    return {
      ok: false,
      error: parsed.error,
    };
  }
}
