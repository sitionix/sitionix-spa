import type {
  ErrorDTO,
  ResponseRegisterUserDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";


export type RegisterUserResult =
  | { ok: true; data: ResponseRegisterUserDTO }
  | { ok: false; error: ErrorDTO };
