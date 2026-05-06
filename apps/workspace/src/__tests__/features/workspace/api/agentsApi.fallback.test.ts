import { beforeEach, describe, expect, it, vi } from "vitest";

const requestJsonMock = vi.fn();

vi.mock("@sitionix/app-afesox-bffssox-frontend-stable/apis", () => ({
  AgentApi: class AgentApi {
    constructor(_: unknown) {}
  },
}));

vi.mock("../../../../shared/http/httpClient", () => ({
  bffApiConfiguration: {},
  requestJson: requestJsonMock,
}));

describe("agentsApi fallback endpoints", () => {
  beforeEach(() => {
    vi.resetModules();
    requestJsonMock.mockReset();
  });

  it("uses requestJson fallback for projects list", async () => {
    requestJsonMock.mockResolvedValue({ ok: true, data: { items: [{ id: "p1" }], page: 0, size: 20, hasNext: false } });

    const { getAgentProjects } = await import("../../../../features/workspace/modules/automation/api/agentsApi");
    const response = await getAgentProjects(0, 20);

    expect(requestJsonMock).toHaveBeenCalledWith({ method: "GET", path: "/api/v1/agent-projects?page=0&size=20" });
    expect(response.items).toEqual([{ id: "p1" }]);
  });

  it("throws status error from projects list fallback", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, status: 503 });

    const { getAgentProjects, getErrorHttpStatus } = await import("../../../../features/workspace/modules/automation/api/agentsApi");

    await expect(getAgentProjects(0, 20)).rejects.toThrow("Unable to load projects");
    await expect(getAgentProjects(0, 20).catch((error) => getErrorHttpStatus(error))).resolves.toBe(503);
  });

  it("uses requestJson fallback for single project and create project", async () => {
    requestJsonMock
      .mockResolvedValueOnce({ ok: true, data: { id: "p2", name: "Project 2" } })
      .mockResolvedValueOnce({ ok: true, data: { id: "p3", name: "Project 3" } });

    const { createAgentProject, getAgentProject } = await import("../../../../features/workspace/modules/automation/api/agentsApi");

    const project = await getAgentProject("project id");
    const created = await createAgentProject({ name: "  Project 3  ", description: "  Desc  " });

    expect(project.id).toBe("p2");
    expect(created.id).toBe("p3");
    expect(requestJsonMock).toHaveBeenNthCalledWith(1, { method: "GET", path: "/api/v1/agent-projects/project%20id" });
    expect(requestJsonMock).toHaveBeenNthCalledWith(2, {
      method: "POST",
      path: "/api/v1/agent-projects",
      body: { name: "Project 3", description: "Desc" },
    });
  });

  it("throws status errors for single-project and create-project fallback", async () => {
    const { createAgentProject, getAgentProject, getErrorHttpStatus } = await import("../../../../features/workspace/modules/automation/api/agentsApi");

    requestJsonMock.mockResolvedValueOnce({ ok: false, status: 404 });
    const getProjectError = await getAgentProject("project-404").catch((error) => error);
    expect(getProjectError.message).toBe("Unable to load project");
    expect(getErrorHttpStatus(getProjectError)).toBe(404);

    requestJsonMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const createProjectError = await createAgentProject({ name: "Project X" }).catch((error) => error);
    expect(createProjectError.message).toBe("Unable to create project");
    expect(getErrorHttpStatus(createProjectError)).toBe(500);
  });
});
