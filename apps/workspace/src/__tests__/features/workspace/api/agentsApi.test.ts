import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-112-unstable/apis";
import {
  createAgent,
  getAgentById,
  getAgents,
  getErrorHttpStatus,
  patchAgent,
} from "../../../../features/workspace/modules/automation/api/agentsApi";

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

  it("throws when description is blank", async () => {
    await expect(createAgent({ name: "agent", description: "  " })).rejects.toThrow(
      "Agent description is required"
    );
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
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    const result = await getAgentById("agent-5");

    expect(getAgentSpy).toHaveBeenCalledWith({ agentId: "agent-5" });
    expect(result.id).toBe("agent-5");
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
      "At least one field (name or description) must be provided"
    );
  });

  it("rejects blank name", async () => {
    await expect(patchAgent("agent-1", { name: "   " })).rejects.toThrow("Agent name is required");
  });

  it("rejects blank description", async () => {
    await expect(patchAgent("agent-1", { description: "   " })).rejects.toThrow(
      "Agent description is required"
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
