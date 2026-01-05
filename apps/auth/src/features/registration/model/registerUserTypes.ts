import type { ApiError, RegisterUserResponse } from "@sitionix/contracts";


export type RegisterUserResult =
  | { ok: true; data: RegisterUserResponse }
  | { ok: false; error: ApiError };
