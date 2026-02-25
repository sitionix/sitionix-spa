import {
  accessTokenStore,
  type AccessTokenPersistenceMode,
  type AccessTokenStore,
} from "./accessToken/accessTokenStore";
import {
  createRefreshClient,
  RefreshClientError,
  type RefreshClient,
} from "./refresh/refreshClient";

type UnauthenticatedHandler = () => void;
type RefreshSyncMessageType = "REFRESH_START" | "REFRESH_SUCCESS" | "REFRESH_FAIL";
type RefreshWaitOutcome = "none" | "success" | "fail" | "timeout";

type RefreshSyncMessage = {
  type: RefreshSyncMessageType;
  tabId: string;
  ts: number;
};

const REFRESH_BROADCAST_CHANNEL = "sitionix-auth";
const REFRESH_IN_PROGRESS_TTL_MS = 10_000;
const REFRESH_WAIT_TIMEOUT_MS = 2_000;
const REFRESH_POST_BROADCAST_DELAY_MS = 100;
const REFRESH_START_GRACE_MS = 35;

const createTabId = (): string => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return `tab-${crypto.randomUUID()}`;
    }

    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const suffix = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      return `tab-${suffix}`;
    }
  }

  const nowPart = Date.now().toString(36);
  const perfPart =
    typeof performance === "undefined"
      ? "0"
      : Math.floor(performance.now()).toString(36);
  return `tab-${nowPart}-${perfPart}`;
};

const isRefreshSyncMessage = (value: unknown): value is RefreshSyncMessage => {
  if (value && typeof value === "object") {
    const message = value as Partial<RefreshSyncMessage>;
    return (
      (message.type === "REFRESH_START" ||
        message.type === "REFRESH_SUCCESS" ||
        message.type === "REFRESH_FAIL") &&
      typeof message.tabId === "string" &&
      typeof message.ts === "number"
    );
  }

  return false;
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

class RefreshCrossTabCoordinator {
  private readonly tabId = createTabId();
  private readonly channel: BroadcastChannel | null;
  private readonly waiters = new Set<(outcome: RefreshWaitOutcome) => void>();
  private externalRefreshUntilEpochMs = 0;

  public constructor() {
    if (
      typeof globalThis === "undefined" ||
      typeof globalThis.BroadcastChannel !== "function"
    ) {
      this.channel = null;
      return;
    }

    this.channel = new BroadcastChannel(REFRESH_BROADCAST_CHANNEL);
    this.channel.onmessage = (event: MessageEvent) => {
      const message = event.data;
      if (!isRefreshSyncMessage(message) || message.tabId === this.tabId) {
        return;
      }

      if (message.type === "REFRESH_START") {
        this.externalRefreshUntilEpochMs = Date.now() + REFRESH_IN_PROGRESS_TTL_MS;
        return;
      }

      this.externalRefreshUntilEpochMs = 0;
      const outcome: RefreshWaitOutcome =
        message.type === "REFRESH_SUCCESS" ? "success" : "fail";
      for (const waiter of this.waiters) {
        waiter(outcome);
      }
      this.waiters.clear();
    };
  }

  public announceStart(): void {
    this.externalRefreshUntilEpochMs = Date.now() + REFRESH_IN_PROGRESS_TTL_MS;
    this.broadcast("REFRESH_START");
  }

  public announceSuccess(): void {
    this.externalRefreshUntilEpochMs = 0;
    this.broadcast("REFRESH_SUCCESS");
  }

  public announceFail(): void {
    this.externalRefreshUntilEpochMs = 0;
    this.broadcast("REFRESH_FAIL");
  }

  public async waitForExternalRefresh(
    timeoutMs = REFRESH_WAIT_TIMEOUT_MS
  ): Promise<RefreshWaitOutcome> {
    if (!this.channel) {
      return "none";
    }

    if (!this.isExternalRefreshActive()) {
      await wait(REFRESH_START_GRACE_MS);
    }

    if (!this.isExternalRefreshActive()) {
      return "none";
    }

    return new Promise<RefreshWaitOutcome>((resolve) => {
      const timer = setTimeout(() => {
        this.waiters.delete(resolveWaiter);
        resolve("timeout");
      }, timeoutMs);

      const resolveWaiter = (outcome: RefreshWaitOutcome) => {
        clearTimeout(timer);
        this.waiters.delete(resolveWaiter);
        resolve(outcome);
      };

      this.waiters.add(resolveWaiter);
    });
  }

  private isExternalRefreshActive(): boolean {
    return Date.now() < this.externalRefreshUntilEpochMs;
  }

  private broadcast(type: RefreshSyncMessageType): void {
    if (!this.channel) {
      return;
    }

    const payload: RefreshSyncMessage = {
      type,
      tabId: this.tabId,
      ts: Date.now(),
    };
    this.channel.postMessage(payload);
  }
}

export type AuthSessionManagerConfigureOptions = {
  baseUrl?: string;
  accessTokenPersistenceMode?: AccessTokenPersistenceMode;
  onUnauthenticated?: UnauthenticatedHandler | null;
};

export class AuthSessionManager {
  private readonly store: AccessTokenStore;
  private readonly unauthenticatedSubscribers = new Set<UnauthenticatedHandler>();
  private readonly crossTabCoordinator = new RefreshCrossTabCoordinator();
  private refreshPromise: Promise<string | null> | null = null;
  private refreshClient: RefreshClient;
  private configuredUnauthenticatedHandler: UnauthenticatedHandler | null = null;

  public constructor(options?: {
    accessTokenStore?: AccessTokenStore;
    refreshClient?: RefreshClient;
  }) {
    this.store = options?.accessTokenStore ?? accessTokenStore;
    this.refreshClient = options?.refreshClient ?? createRefreshClient();
  }

  public configure(options: AuthSessionManagerConfigureOptions): void {
    if ("baseUrl" in options && options.baseUrl !== undefined) {
      this.refreshClient = createRefreshClient({ baseUrl: options.baseUrl });
    }

    if (
      "accessTokenPersistenceMode" in options &&
      options.accessTokenPersistenceMode !== undefined
    ) {
      this.store.setPersistenceMode(options.accessTokenPersistenceMode);
    }

    if ("onUnauthenticated" in options) {
      this.configuredUnauthenticatedHandler = options.onUnauthenticated ?? null;
    }
  }

  public async bootstrap(): Promise<void> {
    await this.refresh();
  }

  public getAccessToken(): string | null {
    if (this.store.isExpired()) {
      return null;
    }

    return this.store.get();
  }

  public setAccessToken(token: string, expiresInSeconds: number): void {
    this.store.set(token, expiresInSeconds);
  }

  public clear(): void {
    this.store.clear();
  }

  public async refresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshPromise = this.runRefresh();
    this.refreshPromise = refreshPromise;
    return refreshPromise;
  }

  public async ensureFreshAccessToken(): Promise<string | null> {
    const token = this.getAccessToken();
    if (token) {
      return token;
    }

    return this.refresh();
  }

  public onUnauthenticated(handler: UnauthenticatedHandler): () => void {
    this.unauthenticatedSubscribers.add(handler);
    return () => {
      this.unauthenticatedSubscribers.delete(handler);
    };
  }

  private async runRefresh(): Promise<string | null> {
    try {
      const waitOutcome = await this.crossTabCoordinator.waitForExternalRefresh();

      if (waitOutcome === "success") {
        await wait(REFRESH_POST_BROADCAST_DELAY_MS);
      }

      return this.performRefresh();
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    this.crossTabCoordinator.announceStart();

    try {
      const response = await this.refreshClient();
      this.store.set(response.accessToken, response.expiresIn);
      this.crossTabCoordinator.announceSuccess();
      return response.accessToken;
    } catch (error) {
      this.crossTabCoordinator.announceFail();
      if (
        error instanceof RefreshClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        this.store.clear();
        this.emitUnauthenticated();
      }

      return null;
    }
  }

  private emitUnauthenticated(): void {
    this.configuredUnauthenticatedHandler?.();
    for (const subscriber of this.unauthenticatedSubscribers) {
      subscriber();
    }
  }
}

export const authSessionManager = new AuthSessionManager();
