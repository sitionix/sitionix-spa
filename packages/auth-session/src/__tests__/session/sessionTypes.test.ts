import { describe, expect, it } from "vitest";
import type { SessionState } from "../../session/sessionTypes";

describe("sessionTypes", () => {
  it("accepts authenticated session shape", () => {
    const session: SessionState = {
      authenticated: true,
      user: {
        id: "1",
        email: "user@example.com",
        role: "SUPER_ADMIN",
      },
      idleTimeoutSeconds: 86400,
    };

    expect(session.authenticated).toBe(true);
    expect(session.user?.email).toBe("user@example.com");
  });
});
