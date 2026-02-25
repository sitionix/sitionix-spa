import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionManager } from "../../AuthSessionManager";
import { AccessTokenStore } from "../../accessToken/accessTokenStore";
import { RefreshClientError } from "../../refresh/refreshClient";

type BroadcastMessageHandler = ((event: MessageEvent) => void) | null;

class BroadcastChannelMock {
  private static channels = new Map<string, Set<BroadcastChannelMock>>();
  private readonly name: string;
  public onmessage: BroadcastMessageHandler = null;

  public constructor(name: string) {
    this.name = name;
    const peers = BroadcastChannelMock.channels.get(name) ?? new Set();
    peers.add(this);
    BroadcastChannelMock.channels.set(name, peers);
  }

  public postMessage(data: unknown): void {
    const peers = BroadcastChannelMock.channels.get(this.name);
    if (!peers) {
      return;
    }

    for (const peer of peers) {
      if (peer === this || !peer.onmessage) {
        continue;
      }
      peer.onmessage({ data } as MessageEvent);
    }
  }

  public close(): void {
    const peers = BroadcastChannelMock.channels.get(this.name);
    peers?.delete(this);
    if (peers && peers.size === 0) {
      BroadcastChannelMock.channels.delete(this.name);
    }
  }
}

describe("AuthSessionManager.refresh", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Given concurrent refresh calls When refreshing Then performs single-flight request", async () => {
    // Given
    const refreshClient = vi
      .fn()
      .mockImplementation(async () => ({
        accessToken: "new-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      }));
    const manager = new AuthSessionManager({
      accessTokenStore: new AccessTokenStore(),
      refreshClient,
    });

    // When
    const [first, second, third] = await Promise.all([
      manager.refresh(),
      manager.refresh(),
      manager.refresh(),
    ]);

    // Then
    expect(refreshClient).toHaveBeenCalledTimes(1);
    expect(first).toBe("new-token");
    expect(second).toBe("new-token");
    expect(third).toBe("new-token");
  });

  it("Given unauthorized refresh error When refreshing Then clears token and notifies unauthenticated", async () => {
    // Given
    const refreshClient = vi
      .fn()
      .mockRejectedValue(new RefreshClientError("Unauthorized", 401));
    const manager = new AuthSessionManager({
      accessTokenStore: new AccessTokenStore(),
      refreshClient,
    });
    const unauthenticatedSpy = vi.fn();
    manager.setAccessToken("old-token", 3600);
    manager.onUnauthenticated(unauthenticatedSpy);

    // When
    const refreshedToken = await manager.refresh();

    // Then
    expect(refreshedToken).toBeNull();
    expect(manager.getAccessToken()).toBeNull();
    expect(unauthenticatedSpy).toHaveBeenCalledTimes(1);
  });

  it("Given two managers in separate tabs When refresh starts in first Then second waits and does not run in parallel", async () => {
    // Given
    let resolveFirstRefresh: ((value: {
      accessToken: string;
      expiresIn: number;
      tokenType: string;
    }) => void) | null = null;

    const firstRefreshClient = vi.fn().mockImplementation(
      async () =>
        new Promise<{
          accessToken: string;
          expiresIn: number;
          tokenType: string;
        }>((resolve) => {
          resolveFirstRefresh = resolve;
        })
    );

    const secondRefreshClient = vi.fn().mockResolvedValue({
      accessToken: "second-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    });

    const firstManager = new AuthSessionManager({
      accessTokenStore: new AccessTokenStore(),
      refreshClient: firstRefreshClient,
    });
    const secondManager = new AuthSessionManager({
      accessTokenStore: new AccessTokenStore(),
      refreshClient: secondRefreshClient,
    });

    // When
    const firstRefreshPromise = firstManager.refresh();
    await new Promise((resolve) => {
      setTimeout(resolve, 80);
    });
    const secondRefreshPromise = secondManager.refresh();
    await new Promise((resolve) => {
      setTimeout(resolve, 25);
    });

    // Then
    expect(firstRefreshClient).toHaveBeenCalledTimes(1);
    expect(secondRefreshClient).toHaveBeenCalledTimes(0);

    resolveFirstRefresh?.({
      accessToken: "first-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    });

    const [firstToken, secondToken] = await Promise.all([
      firstRefreshPromise,
      secondRefreshPromise,
    ]);

    expect(firstToken).toBe("first-token");
    expect(secondToken).toBe("second-token");
    expect(secondRefreshClient).toHaveBeenCalledTimes(1);
  });
});
