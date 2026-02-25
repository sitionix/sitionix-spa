import type { ApiError } from "@sitionix/contracts";

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginUserRequest = {
  email: string;
  password: string;
  siteId?: string;
  sessionSourceId: string;
  userAgent: string;
};

export type LoginUserResponse = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
};

export type LoginUserResult =
  | { ok: true; data: LoginUserResponse }
  | { ok: false; error: ApiError };
