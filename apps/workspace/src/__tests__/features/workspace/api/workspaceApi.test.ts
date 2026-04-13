import { describe, expect, it, vi } from "vitest";
import { createWorkspaceApi } from "../../../../features/workspace/api/workspaceApi";

const ok = <T>(data: T) => ({ ok: true as const, data });

describe("createWorkspaceApi", () => {
  it("returns http api", async () => {
    const requestJson = vi.fn().mockResolvedValue(
      ok({
        totalSites: 0,
        publishedSites: 0,
        totalVisits: 0,
        activeUsers: 0,
        recentSites: [],
      })
    );
    const api = createWorkspaceApi({ baseUrl: "", requestJson });

    await api.getDashboardSummary();

    expect(requestJson).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/workspace/dashboard",
    });
  });
});
