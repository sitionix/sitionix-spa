import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-116-unstable/apis";

vi.mock("../../../../shared/http/httpClient", async () => {
  const actual = await vi.importActual<typeof import("../../../../shared/http/httpClient")>(
    "../../../../shared/http/httpClient"
  );

  return {
    ...actual,
    requestJson: vi.fn(),
  };
});

import {
  activateAgent,
  archiveAgent,
  createAgent,
  deleteAgent,
  getAgentById,
  getAgents,
  getErrorHttpStatus,
  patchAgent,
  restoreAgent,
} from "../../../../features/workspace/modules/automation/api/agentsApi";
import { requestJson } from "../../../../shared/http/httpClient";

const requestJsonMock = vi.mocked(requestJson);

describe("agentsApi.getAgents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns agent items from successful response", async () => {
    const getAgentsSpy = vi.spyOn(AgentApi.prototype, "getAgents").mockResolvedValue({
      items: [
        {
          id: "agent-1",
          name: "Architecture Reviewer",
          description: "Checks design",
          status: "DRAFT",
          createdAt: "2026-04-10T10:00:00.000Z",
          updatedAt: "2026-04-10T10:00:00.000Z",
        },
      ],
    });

    const result = await getAgents();

    expect(getAgentsSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: "agent-1",
        name: "Architecture Reviewer",
        description: "Checks design",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);
  });

  it("returns empty array when items are missing", async () => {
    vi.spyOn(AgentApi.prototype, "getAgents").mockResolvedValue({
      items: undefined,
    });

    const result = await getAgents();

    expect(result).toEqual([]);
  });
});

describe("agentsApi.createAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("trims fields and returns created agent", async () => {
    const createAgentSpy = vi.spyOn(AgentApi.prototype, "createAgent").mockResolvedValue({
      id: "agent-2",
      name: "Agent",
      description: "Description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    const result = await createAgent({
      name: "  Agent  ",
      description: "  Description  ",
    });

    expect(createAgentSpy).toHaveBeenCalledWith({
      createAgentRequestDTO: {
        name: "Agent",
        description: "Description",
      },
    });
    expect(result).toEqual({
      id: "agent-2",
      name: "Agent",
      description: "Description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });
  });

  it("throws when name is blank", async () => {
    await expect(createAgent({ name: "  ", description: "desc" })).rejects.toThrow(
      "Agent name is required"
    );
  });

  it("creates agent when only name is provided", async () => {
    const createAgentSpy = vi.spyOn(AgentApi.prototype, "createAgent").mockResolvedValue({
      id: "agent-3",
      name: "Name only",
      description: undefined,
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    await createAgent({ name: "  Name only  " });

    expect(createAgentSpy).toHaveBeenCalledWith({
      createAgentRequestDTO: {
        name: "Name only",
      },
    });
  });
});

describe("agentsApi.getAgentById", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getAgent with route parameter and returns response", async () => {
    const getAgentSpy = vi.spyOn(AgentApi.prototype, "getAgent").mockResolvedValue({
      id: "agent-5",
      name: "Review Agent",
      description: "Description",
      instruction: "Review boundaries strictly.",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    const result = await getAgentById("agent-5");

    expect(getAgentSpy).toHaveBeenCalledWith({ agentId: "agent-5" });
    expect(result.id).toBe("agent-5");
    expect(result.instruction).toBe("Review boundaries strictly.");
  });
});

describe("agentsApi.patchAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("patches name only with trimmed value", async () => {
    const patchAgentSpy = vi.spyOn(AgentApi.prototype, "patchAgent").mockResolvedValue({
      id: "agent-1",
      name: "Updated Name",
      description: "Description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-11T10:00:00.000Z",
    });

    const result = await patchAgent("agent-1", { name: "  Updated Name  " });

    expect(patchAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      patchAgentRequestDTO: { name: "Updated Name" },
    });
    expect(result.name).toBe("Updated Name");
    expect(result.description).toBe("Description");
  });

  it("patches description only with trimmed value", async () => {
    const patchAgentSpy = vi.spyOn(AgentApi.prototype, "patchAgent").mockResolvedValue({
      id: "agent-1",
      name: "Name",
      description: "Updated description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-11T10:00:00.000Z",
    });

    const result = await patchAgent("agent-1", { description: "  Updated description  " });

    expect(patchAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      patchAgentRequestDTO: { description: "Updated description" },
    });
    expect(result.name).toBe("Name");
    expect(result.description).toBe("Updated description");
  });

  it("patches both name and description when both provided", async () => {
    const patchAgentSpy = vi.spyOn(AgentApi.prototype, "patchAgent").mockResolvedValue({
      id: "agent-1",
      name: "Updated Name",
      description: "Updated description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-11T10:00:00.000Z",
    });

    await patchAgent("agent-1", { name: " Updated Name ", description: " Updated description " });

    expect(patchAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      patchAgentRequestDTO: {
        name: "Updated Name",
        description: "Updated description",
      },
    });
  });

  it("rejects empty payload", async () => {
    await expect(patchAgent("agent-1", {})).rejects.toThrow(
      "At least one field (name, description or instruction) must be provided"
    );
  });

  it("rejects blank name", async () => {
    await expect(patchAgent("agent-1", { name: "   " })).rejects.toThrow("Agent name is required");
  });

  it("maps blank description to null to clear optional description", async () => {
    const patchAgentSpy = vi.spyOn(AgentApi.prototype, "patchAgent").mockResolvedValue({
      id: "agent-1",
      name: "Name",
      description: null,
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-11T10:00:00.000Z",
    });

    const result = await patchAgent("agent-1", { description: "   " });

    expect(patchAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      patchAgentRequestDTO: { description: null },
    });
    expect(result.description).toBeNull();
  });

  it("patches instruction only with trimmed value", async () => {
    const patchAgentSpy = vi.spyOn(AgentApi.prototype, "patchAgent").mockResolvedValue({
      id: "agent-1",
      name: "Name",
      description: "Description",
      instruction: "Updated instruction",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-11T10:00:00.000Z",
    });

    const result = await patchAgent("agent-1", { instruction: "  Updated instruction  " });

    expect(patchAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      patchAgentRequestDTO: { instruction: "Updated instruction" },
    });
    expect(result.instruction).toBe("Updated instruction");
  });

  it("rejects blank instruction", async () => {
    await expect(patchAgent("agent-1", { instruction: "   " })).rejects.toThrow(
      "Agent instruction is required"
    );
  });
});

describe("agentsApi.getErrorHttpStatus", () => {
  it("returns top-level numeric status", () => {
    expect(getErrorHttpStatus({ status: 404 })).toBe(404);
  });

  it("returns nested response status", () => {
    expect(getErrorHttpStatus({ response: { status: 400 } })).toBe(400);
  });

  it("returns null for unknown error shape", () => {
    expect(getErrorHttpStatus("boom")).toBeNull();
  });
});

describe("agentsApi.lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    requestJsonMock.mockReset();
  });

  it("calls activateAgent endpoint with agent id", async () => {
    const activateSpy = vi.spyOn(AgentApi.prototype, "activateAgent").mockResolvedValue({
      id: "agent-7",
      name: "Lifecycle Agent",
      description: "Description",
      status: "ACTIVE",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-14T10:00:00.000Z",
    });

    const result = await activateAgent("agent-7");

    expect(activateSpy).toHaveBeenCalledWith({ agentId: "agent-7" });
    expect(result.status).toBe("ACTIVE");
  });

  it("calls archiveAgent endpoint with agent id", async () => {
    const archiveSpy = vi.spyOn(AgentApi.prototype, "archiveAgent").mockResolvedValue({
      id: "agent-7",
      name: "Lifecycle Agent",
      description: "Description",
      status: "ARCHIVED",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
    });

    const result = await archiveAgent("agent-7");

    expect(archiveSpy).toHaveBeenCalledWith({ agentId: "agent-7" });
    expect(result.status).toBe("ARCHIVED");
  });

  it("calls restore endpoint via POST and returns updated agent", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      data: {
        id: "agent-7",
        name: "Lifecycle Agent",
        description: "Description",
        status: "ARCHIVED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-16T10:00:00.000Z",
      },
    });

    const result = await restoreAgent("agent-7");

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/agents/agent-7/restore",
    });
    expect(result.id).toBe("agent-7");
  });

  it("calls delete endpoint via DELETE and returns deleted agent payload", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      data: {
        id: "agent-7",
        name: "Lifecycle Agent",
        description: "Description",
        status: "DELETED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-17T10:00:00.000Z",
      },
    });

    const result = await deleteAgent("agent-7");

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/api/v1/agents/agent-7",
    });
    expect(result.status).toBe("DELETED");
  });

  it("keeps repeated delete calls successful when backend returns ok each time", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "agent-7",
          name: "Lifecycle Agent",
          description: "Description",
          status: "DELETED",
          createdAt: "2026-04-10T10:00:00.000Z",
          updatedAt: "2026-04-17T10:00:00.000Z",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "agent-7",
          name: "Lifecycle Agent",
          description: "Description",
          status: "DELETED",
          createdAt: "2026-04-10T10:00:00.000Z",
          updatedAt: "2026-04-18T10:00:00.000Z",
        },
      });

    const first = await deleteAgent("agent-7");
    const second = await deleteAgent("agent-7");

    expect(first.status).toBe("DELETED");
    expect(second.status).toBe("DELETED");
    expect(requestJsonMock).toHaveBeenNthCalledWith(1, {
      method: "DELETE",
      path: "/api/v1/agents/agent-7",
    });
    expect(requestJsonMock).toHaveBeenNthCalledWith(2, {
      method: "DELETE",
      path: "/api/v1/agents/agent-7",
    });
  });

  it("throws request error when delete request fails", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      error: new Error("Forbidden for workspace scope"),
    });

    await expect(deleteAgent("agent-7")).rejects.toThrow("Forbidden for workspace scope");
  });
});
