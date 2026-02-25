export type AccessTokenPersistenceMode = "MEMORY" | "SESSION_STORAGE";

type StoredAccessTokenPayload = {
  token: string;
  expiresAtEpochMs: number;
};

const SESSION_STORAGE_ACCESS_TOKEN_KEY = "sitionix.auth.accessToken.payload";

const resolveSessionStorage = (): Storage | null => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return null;
  }

  return browserWindow.sessionStorage;
};

export class AccessTokenStore {
  private token: string | null = null;
  private expiresAtEpochMs: number | null = null;
  private hydratedFromStorage = false;
  private persistenceMode: AccessTokenPersistenceMode;

  public constructor(persistenceMode: AccessTokenPersistenceMode = "MEMORY") {
    this.persistenceMode = persistenceMode;
  }

  public get(): string | null {
    this.hydrateFromStorageIfNeeded();
    return this.token;
  }

  public set(token: string, expiresInSeconds: number): void {
    this.hydratedFromStorage = true;
    this.token = token;
    this.expiresAtEpochMs =
      Date.now() + Math.max(0, expiresInSeconds) * 1000;
    this.persistToStorageIfNeeded();
  }

  public clear(): void {
    this.hydratedFromStorage = true;
    this.token = null;
    this.expiresAtEpochMs = null;

    const storage = resolveSessionStorage();
    storage?.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
  }

  public isExpired(skewSeconds = 30): boolean {
    this.hydrateFromStorageIfNeeded();
    if (!this.token || !this.expiresAtEpochMs) {
      return true;
    }

    const skewMs = Math.max(0, skewSeconds) * 1000;
    return Date.now() + skewMs >= this.expiresAtEpochMs;
  }

  public setPersistenceMode(mode: AccessTokenPersistenceMode): void {
    this.persistenceMode = mode;
    if (mode === "MEMORY") {
      const storage = resolveSessionStorage();
      storage?.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
      return;
    }

    this.persistToStorageIfNeeded();
  }

  private hydrateFromStorageIfNeeded(): void {
    if (this.hydratedFromStorage || this.persistenceMode !== "SESSION_STORAGE") {
      return;
    }

    this.hydratedFromStorage = true;
    const storage = resolveSessionStorage();
    const raw = storage?.getItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredAccessTokenPayload;
      if (
        typeof parsed.token !== "string" ||
        typeof parsed.expiresAtEpochMs !== "number"
      ) {
        storage?.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
        return;
      }

      this.token = parsed.token;
      this.expiresAtEpochMs = parsed.expiresAtEpochMs;
    } catch {
      storage?.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
    }
  }

  private persistToStorageIfNeeded(): void {
    const storage = resolveSessionStorage();
    if (!storage) {
      return;
    }

    if (this.persistenceMode !== "SESSION_STORAGE") {
      storage.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
      return;
    }

    if (!this.token || !this.expiresAtEpochMs) {
      storage.removeItem(SESSION_STORAGE_ACCESS_TOKEN_KEY);
      return;
    }

    const payload: StoredAccessTokenPayload = {
      token: this.token,
      expiresAtEpochMs: this.expiresAtEpochMs,
    };
    storage.setItem(SESSION_STORAGE_ACCESS_TOKEN_KEY, JSON.stringify(payload));
  }
}

export const accessTokenStore = new AccessTokenStore();
