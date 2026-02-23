export type SessionUser = {
  id: string;
  email: string;
  role: string;
  siteId?: string;
};

export type SessionState = {
  authenticated: boolean;
  user?: SessionUser;
  expiresAt?: string;
  idleTimeoutSeconds?: number;
};
