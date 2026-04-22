import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";

import {
  activateAgent,
  archiveAgent,
  chatAgent,
  createAgent,
  deleteAgent,
  getAgentById,
  getAgentConversation,
  getAgentConversations,
  getAgents,
  getErrorHttpStatus,
  patchAgent,
  restoreAgent,
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
    const restoreSpy = vi.fn().mockResolvedValue({
      id: "agent-7",
      name: "Lifecycle Agent",
      description: "Description",
      status: "ARCHIVED",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-16T10:00:00.000Z",
    });
    (AgentApi.prototype as any).restoreAgent = restoreSpy;

    const result = await restoreAgent("agent-7");

    expect(restoreSpy).toHaveBeenCalledWith({ agentId: "agent-7" });
    expect(result.id).toBe("agent-7");
  });

  it("calls delete endpoint via DELETE and returns deleted agent payload", async () => {
    const deleteSpy = vi.fn().mockResolvedValue({
      id: "agent-7",
      name: "Lifecycle Agent",
      description: "Description",
      status: "DELETED",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-17T10:00:00.000Z",
    });
    (AgentApi.prototype as any).deleteAgent = deleteSpy;

    const result = await deleteAgent("agent-7");

    expect(deleteSpy).toHaveBeenCalledWith({ agentId: "agent-7" });
    expect(result.status).toBe("DELETED");
  });

  it("keeps repeated delete calls successful when backend returns success each time", async () => {
    const deleteSpy = vi.fn();
    (AgentApi.prototype as any).deleteAgent = deleteSpy;
    deleteSpy
      .mockResolvedValueOnce({
        id: "agent-7",
        name: "Lifecycle Agent",
        description: "Description",
        status: "DELETED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-17T10:00:00.000Z",
      })
      .mockResolvedValueOnce({
        id: "agent-7",
        name: "Lifecycle Agent",
        description: "Description",
        status: "DELETED",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-18T10:00:00.000Z",
      });

    const first = await deleteAgent("agent-7");
    const second = await deleteAgent("agent-7");

    expect(first.status).toBe("DELETED");
    expect(second.status).toBe("DELETED");
    expect(deleteSpy).toHaveBeenNthCalledWith(1, { agentId: "agent-7" });
    expect(deleteSpy).toHaveBeenNthCalledWith(2, { agentId: "agent-7" });
  });

  it("throws request error when delete request fails", async () => {
    (AgentApi.prototype as any).deleteAgent = vi
      .fn()
      .mockRejectedValue(new Error("Forbidden for workspace scope"));

    await expect(deleteAgent("agent-7")).rejects.toThrow("Forbidden for workspace scope");
  });
});

describe("agentsApi.chat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized conversation list and defaults to empty array when items missing", async () => {
    const getAgentConversationsSpy = vi.fn().mockResolvedValue({});
    (AgentApi.prototype as any).getAgentConversations = getAgentConversationsSpy;

    const result = await getAgentConversations("agent-11");

    expect(getAgentConversationsSpy).toHaveBeenCalledWith({ agentId: "agent-11" });
    expect(result).toEqual({ items: [] });
  });

  it("returns normalized conversation details and defaults messages to empty array when missing", async () => {
    const getAgentConversationSpy = vi.fn().mockResolvedValue({
      id: "conv-1",
      title: "Title",
      type: "DIRECT",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:01:00.000Z",
      lastMessageAt: "2026-04-21T10:01:00.000Z",
    });
    (AgentApi.prototype as any).getAgentConversation = getAgentConversationSpy;

    const result = await getAgentConversation("conv-1");

    expect(getAgentConversationSpy).toHaveBeenCalledWith({ conversationId: "conv-1" });
    expect(result.messages).toEqual([]);
  });

  it("trims message and calls chat endpoint without conversationId for first send", async () => {
    const chatAgentSpy = vi.fn().mockResolvedValue({
      conversationId: "conv-1",
      reply: {
        id: "msg-1",
        authorType: "AGENT",
        authorId: "agent-11",
        content: "Assistant reply",
        createdAt: "2026-04-21T10:01:00.000Z",
      },
    });
    (AgentApi.prototype as any).chatAgent = chatAgentSpy;

    const result = await chatAgent("agent-11", { message: "  Explain clean architecture  " });

    expect(chatAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-11",
      chatAgentRequestDTO: {
        message: "Explain clean architecture",
      },
    });
    expect(result.reply.content).toBe("Assistant reply");
    expect(result.conversationId).toBe("conv-1");
  });

  it("includes conversationId when continuing existing chat", async () => {
    const chatAgentSpy = vi.fn().mockResolvedValue({
      conversationId: "conv-1",
      reply: {
        id: "msg-2",
        authorType: "AGENT",
        authorId: "agent-11",
        content: "Next reply",
        createdAt: "2026-04-21T10:02:00.000Z",
      },
    });
    (AgentApi.prototype as any).chatAgent = chatAgentSpy;

    await chatAgent("agent-11", {
      conversationId: "conv-1",
      message: "next",
    });

    expect(chatAgentSpy).toHaveBeenCalledWith({
      agentId: "agent-11",
      chatAgentRequestDTO: {
        conversationId: "conv-1",
        message: "next",
      },
    });
  });

  it("throws when message is blank", async () => {
    const chatAgentSpy = vi.fn();
    (AgentApi.prototype as any).chatAgent = chatAgentSpy;
    await expect(chatAgent("agent-11", { message: "   " })).rejects.toThrow("Message is required");
    expect(chatAgentSpy).not.toHaveBeenCalled();
  });

  it("throws request error when chat request fails", async () => {
    (AgentApi.prototype as any).chatAgent = vi.fn().mockRejectedValue(new Error("Gateway timeout"));

    await expect(chatAgent("agent-11", { message: "hello" })).rejects.toThrow("Gateway timeout");
  });
});
