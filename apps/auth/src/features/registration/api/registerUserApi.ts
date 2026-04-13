import { UserApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/apis";
import type {
  ErrorDTO,
  RegisterUserDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";
import { ResponseError } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable";
import type { RegisterUserResult } from "../model/registerUserTypes";
import { bffApiConfiguration } from "../../../shared/http/httpClient";

const userApi = new UserApi(bffApiConfiguration);

const parseError = async (error: unknown): Promise<ErrorDTO> => {
  if (error instanceof ResponseError) {
    const status = error.response.status;
    const payload = (await error.response.clone().json().catch(() => null)) as
      | ErrorDTO
      | null;

    return (
      payload ?? {
        code: status,
        title: "Request failed",
        details: "Register request failed",
      }
    );
  }

  return {
    code: 0,
    title: "Request failed",
    details: "Register request failed",
  };
};

export async function registerUserApi(
  request: RegisterUserDTO,
  signal?: AbortSignal
): Promise<RegisterUserResult> {
  try {
    const response = await userApi.registerUser(
      { registerUserDTO: request },
      signal ? { signal } : undefined
    );
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, error: await parseError(error) };
  }
}
