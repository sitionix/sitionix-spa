import type {
  ErrorDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterUserDTORoleEnum,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type GlobalUserRole = RegisterUserDTORoleEnum;
export type LoginUserRequest = LoginRequestDTO;
export type LoginUserResponse = LoginResponseDTO;

export type LoginUserResult =
  | { ok: true; data: LoginUserResponse }
  | { ok: false; error: ErrorDTO };
