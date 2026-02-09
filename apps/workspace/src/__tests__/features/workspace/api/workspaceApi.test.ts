import { describe, expect, it, vi } from "vitest";
import { createWorkspaceApi } from "../../../../features/workspace/api/workspaceApi";

const ok = <T>(data: T) => ({ ok: true as const, data });

describe("createWorkspaceApi", () => {
  it("returns mock api in mock mode", async () => {
    const api = createWorkspaceApi({ mode: "mock" });
    const sites = await api.getSites();
    expect(sites.items.length).toBeGreaterThan(0);
  });

  it("returns http api in http mode", async () => {
    const requestJson = vi.fn().mockResolvedValue(ok({ items: [], meta: { page: 1, size: 0, totalItems: 0, totalPages: 1 } }));
    const api = createWorkspaceApi({ mode: "http", baseUrl: "", requestJson });

    await api.getSites();

    expect(requestJson).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/workspace/sites",
    });
  });
});
