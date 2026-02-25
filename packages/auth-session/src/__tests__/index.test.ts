import { describe, expect, it } from "vitest";
import * as authSession from "../index";

describe("auth-session package exports", () => {
  it("Given package index When imported Then exposes public API", () => {
    // Then
    expect(authSession.AuthSessionManager).toBeDefined();
    expect(authSession.createRefreshClient).toBeDefined();
    expect(authSession.AccessTokenStore).toBeDefined();
    expect(authSession.getOrCreateSessionSourceId).toBeDefined();
    expect(authSession.getUserAgent).toBeDefined();
    expect(authSession.authSessionManager).toBeDefined();
  });
});
