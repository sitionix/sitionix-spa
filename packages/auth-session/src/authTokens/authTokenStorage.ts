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
  if (globalThis.window === undefined) {
    return null;
  }

  return rememberMe ? globalThis.window.localStorage : globalThis.window.sessionStorage;
}

function clearTokensFromStorage(storage: Storage): void {
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.accessToken);
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken);
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn);
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.tokenType);
}

export function saveAuthTokens(tokens: AuthTokens, rememberMe: boolean): void {
  const storage = getStorage(rememberMe);
  if (!storage) {
    return;
  }

  // Keep a single active token bundle to avoid session/local conflicts across reloads.
  clearTokensFromStorage(globalThis.window.localStorage);
  clearTokensFromStorage(globalThis.window.sessionStorage);

  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, tokens.accessToken);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, tokens.refreshToken);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.expiresIn, String(tokens.expiresIn));
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.tokenType, tokens.tokenType);
}
