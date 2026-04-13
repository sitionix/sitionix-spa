import type {
  ErrorDTO,
  ResponseRegisterUserDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";


export type RegisterUserResult =
  | { ok: true; data: ResponseRegisterUserDTO }
  | { ok: false; error: ErrorDTO };
