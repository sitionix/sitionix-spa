import type { ApiError } from "@sitionix/contracts";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginUserRequest = {
  email: string;
  password: string;
  siteId?: string;
};

export type LoginUserResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    siteId?: string;
  };
  expiresAt?: string;
  idleTimeoutSeconds?: number;
};

export type LoginUserResult =
  | { ok: true; data: LoginUserResponse }
  | { ok: false; error: ApiError };
