export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export const AUTH_TOKEN_STORAGE_KEYS = {
  accessToken: "sitionix.auth.accessToken",
  refreshToken: "sitionix.auth.refreshToken",
  expiresIn: "sitionix.auth.expiresIn",
  tokenType: "sitionix.auth.tokenType",
} as const;

function getStorage(rememberMe: boolean): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return rememberMe ? window.localStorage : window.sessionStorage;
}

export function saveAuthTokens(tokens: AuthTokens, rememberMe: boolean): void {
  const storage = getStorage(rememberMe);
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, tokens.accessToken);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, tokens.refreshToken);
  storage.setItem(
    AUTH_TOKEN_STORAGE_KEYS.expiresIn,
    String(tokens.expiresIn)
  );
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, tokens.tokenType);
}
