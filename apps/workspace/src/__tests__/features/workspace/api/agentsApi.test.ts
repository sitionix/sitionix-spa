import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";

import {
  acceptAgentRule,
  activateAgent,
  archiveAgent,
  chatAgent,
  createAgentProject,
  createAgentRule,
  createAgent,
  deleteAgentRule,
  deleteAgent,
  deleteAgentConversation,
  getAgentById,
  getAgentProject,
  getAgentConversation,
  getAgentConversations,
  getAgentProjects,
  getChatAgentExecution,
  getChatExecutionStatus,
  getAgents,
  getErrorHttpStatus,
  getAgentRules,
  patchAgent,
  patchAgentRule,
  rejectAgentRule,
  restoreAgent,
  submitChatExecution,
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

describe("agentsApi.projects", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads paged projects and normalizes items", async () => {
    const getProjectsSpy = vi.fn().mockResolvedValue({
      items: [
        {
          id: "project-1",
          name: "Marketing Automation",
          description: "Desc",
          status: "ACTIVE",
          createdAt: "2026-05-05T12:00:00Z",
          updatedAt: "2026-05-05T12:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      hasNext: false,
    });
    const originalGetAgentProjects = (AgentApi.prototype as any).getAgentProjects;
    Object.defineProperty(AgentApi.prototype, "getAgentProjects", {
      configurable: true,
      writable: true,
      value: getProjectsSpy,
    });

    try {
      const result = await getAgentProjects(0, 20);

      expect(getProjectsSpy).toHaveBeenCalledWith({ page: 0, size: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("project-1");
    } finally {
      if (typeof originalGetAgentProjects === "undefined") {
        delete (AgentApi.prototype as any).getAgentProjects;
      } else {
        Object.defineProperty(AgentApi.prototype, "getAgentProjects", {
          configurable: true,
          writable: true,
          value: originalGetAgentProjects,
        });
      }
    }
  });

  it("creates project with trimmed payload", async () => {
    const createProjectSpy = vi.fn().mockResolvedValue({
      id: "project-1",
      name: "Marketing Automation",
      description: "Desc",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    const originalCreateAgentProject = (AgentApi.prototype as any).createAgentProject;
    Object.defineProperty(AgentApi.prototype, "createAgentProject", {
      configurable: true,
      writable: true,
      value: createProjectSpy,
    });

    try {
      await createAgentProject({
        name: "  Marketing Automation  ",
        description: "  Desc  ",
      });

      expect(createProjectSpy).toHaveBeenCalledWith({
        createAgentProjectRequestDTO: {
          name: "Marketing Automation",
          description: "Desc",
        },
      });
    } finally {
      if (typeof originalCreateAgentProject === "undefined") {
        delete (AgentApi.prototype as any).createAgentProject;
      } else {
        Object.defineProperty(AgentApi.prototype, "createAgentProject", {
          configurable: true,
          writable: true,
          value: originalCreateAgentProject,
        });
      }
    }
  });

  it("loads single project through generated endpoint when available", async () => {
    const getProjectSpy = vi.fn().mockResolvedValue({
      id: "project-1",
      name: "Project One",
      description: "desc",
      status: "ACTIVE",
      createdAt: "2026-05-05T12:00:00Z",
      updatedAt: "2026-05-05T12:00:00Z",
    });
    const originalGetAgentProject = (AgentApi.prototype as any).getAgentProject;
    Object.defineProperty(AgentApi.prototype, "getAgentProject", {
      configurable: true,
      writable: true,
      value: getProjectSpy,
    });

    try {
      const result = await getAgentProject("project-1");

      expect(getProjectSpy).toHaveBeenCalledWith({ projectId: "project-1" });
      expect(result.id).toBe("project-1");
    } finally {
      if (typeof originalGetAgentProject === "undefined") {
        delete (AgentApi.prototype as any).getAgentProject;
      } else {
        Object.defineProperty(AgentApi.prototype, "getAgentProject", {
          configurable: true,
          writable: true,
          value: originalGetAgentProject,
        });
      }
    }
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
      executionId: "exec-1",
      conversationId: "conv-1",
      status: "QUEUED",
    });
    (AgentApi.prototype as any).submitAgentChatExecution = chatAgentSpy;

    const result = await chatAgent("agent-11", { message: "  Explain clean architecture  " });

    expect(chatAgentSpy).toHaveBeenCalledTimes(1);
    const firstSubmitCall = chatAgentSpy.mock.calls[0]?.[0];
    expect(firstSubmitCall.agentId).toBe("agent-11");
    expect(firstSubmitCall.chatAgentRequestDTO.message).toBe("Explain clean architecture");
    expect(firstSubmitCall.chatAgentRequestDTO.clientRequestId).toEqual(expect.any(String));
    expect(firstSubmitCall.idempotencyKey).toBe(firstSubmitCall.chatAgentRequestDTO.clientRequestId);
    expect(result).toEqual({
      executionId: "exec-1",
      conversationId: "conv-1",
      status: "QUEUED",
    });
  });

  it("includes conversationId when continuing existing chat", async () => {
    const chatAgentSpy = vi.fn().mockResolvedValue({
      executionId: "exec-2",
      conversationId: "conv-1",
      status: "QUEUED",
    });
    (AgentApi.prototype as any).submitAgentChatExecution = chatAgentSpy;

    await chatAgent("agent-11", {
      conversationId: "conv-1",
      message: "next",
    });

    expect(chatAgentSpy).toHaveBeenCalledTimes(1);
    const continueSubmitCall = chatAgentSpy.mock.calls[0]?.[0];
    expect(continueSubmitCall.agentId).toBe("agent-11");
    expect(continueSubmitCall.chatAgentRequestDTO).toMatchObject({
      conversationId: "conv-1",
      message: "next",
    });
    expect(continueSubmitCall.chatAgentRequestDTO.clientRequestId).toEqual(expect.any(String));
    expect(continueSubmitCall.idempotencyKey).toBe(continueSubmitCall.chatAgentRequestDTO.clientRequestId);
  });

  it("returns async accepted lifecycle response when backend replies with execution payload", async () => {
    const chatAgentSpy = vi.fn().mockResolvedValue({
      executionId: "exec-1",
      conversationId: "conv-1",
      status: "QUEUED",
    });
    (AgentApi.prototype as any).submitAgentChatExecution = chatAgentSpy;

    const result = await chatAgent("agent-11", {
      conversationId: "conv-1",
      message: "next",
    });

    expect(result).toEqual({
      executionId: "exec-1",
      conversationId: "conv-1",
      status: "QUEUED",
    });
  });

  it("normalizes unknown lifecycle status to pending for forward compatibility", async () => {
    const chatAgentSpy = vi.fn().mockResolvedValue({
      executionId: "exec-2",
      conversationId: "conv-2",
      status: "ACCEPTED",
    });
    (AgentApi.prototype as any).submitAgentChatExecution = chatAgentSpy;

    const result = await chatAgent("agent-11", { message: "hello" });

    expect(result).toEqual({
      executionId: "exec-2",
      conversationId: "conv-2",
      status: "PENDING",
    });
  });

  it("uses executions-path submit endpoint when default submit endpoint is unavailable", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = undefined;
    const chatAgentByExecutionsPathSpy = vi.fn().mockResolvedValue({
      executionId: "exec-3",
      conversationId: "conv-3",
      status: "QUEUED",
    });
    (AgentApi.prototype as any).submitAgentChatExecutionByExecutionsPath = chatAgentByExecutionsPathSpy;

    const result = await chatAgent("agent-11", { message: "hello" });

    expect(chatAgentByExecutionsPathSpy).toHaveBeenCalledTimes(1);
    const executionsPathCall = chatAgentByExecutionsPathSpy.mock.calls[0]?.[0];
    expect(executionsPathCall.agentId).toBe("agent-11");
    expect(executionsPathCall.chatAgentRequestDTO.message).toBe("hello");
    expect(executionsPathCall.chatAgentRequestDTO.clientRequestId).toEqual(expect.any(String));
    expect(executionsPathCall.idempotencyKey).toBe(executionsPathCall.chatAgentRequestDTO.clientRequestId);
    expect(result).toEqual({
      executionId: "exec-3",
      conversationId: "conv-3",
      status: "QUEUED",
    });
  });

  it("calls submit execution endpoint with bound api context", async () => {
    const submitSpy = vi.fn(function submit(this: unknown) {
      if (!this) {
        throw new Error("UNBOUND_THIS");
      }
      return Promise.resolve({
        executionId: "exec-ctx",
        conversationId: "conv-ctx",
        status: "QUEUED",
      });
    });
    (AgentApi.prototype as any).submitAgentChatExecution = submitSpy;

    const result = await chatAgent("agent-11", { message: "context" });

    expect(result).toEqual({
      executionId: "exec-ctx",
      conversationId: "conv-ctx",
      status: "QUEUED",
    });
  });

  it("reuses provided clientRequestId as idempotency key", async () => {
    const submitSpy = vi.fn().mockResolvedValue({
      executionId: "exec-idem",
      conversationId: "conv-idem",
      status: "QUEUED",
    });
    (AgentApi.prototype as any).submitAgentChatExecution = submitSpy;

    await chatAgent("agent-11", {
      message: "hello",
      clientRequestId: "11111111-1111-4111-8111-111111111111",
    });

    expect(submitSpy).toHaveBeenCalledWith({
      agentId: "agent-11",
      chatAgentRequestDTO: {
        message: "hello",
        clientRequestId: "11111111-1111-4111-8111-111111111111",
      },
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("throws when message is blank", async () => {
    const chatAgentSpy = vi.fn();
    (AgentApi.prototype as any).chatAgent = chatAgentSpy;
    await expect(chatAgent("agent-11", { message: "   " })).rejects.toThrow("Message is required");
    expect(chatAgentSpy).not.toHaveBeenCalled();
  });

  it("throws request error when chat request fails", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockRejectedValue(new Error("Gateway timeout"));

    await expect(chatAgent("agent-11", { message: "hello" })).rejects.toThrow("Gateway timeout");
  });

  it("forwards execution id to lifecycle endpoint and returns result", async () => {
    const getExecutionSpy = vi.fn().mockResolvedValue({
      executionId: "exec-10",
      conversationId: "conv-10",
      status: "RUNNING",
    });
    (AgentApi.prototype as any).getAgentChatExecution = getExecutionSpy;

    const result = await getChatAgentExecution("agent-11", "exec-10", "conv-10");

    expect(getExecutionSpy).toHaveBeenCalledWith({ agentId: "agent-11", executionId: "exec-10", conversationId: "conv-10" });
    expect(result).toEqual({
      executionId: "exec-10",
      conversationId: "conv-10",
      status: "RUNNING",
    });
  });

  it("maps completed lifecycle response to completed with reply", async () => {
    const getExecutionSpy = vi.fn().mockResolvedValue({
      executionId: "exec-11",
      conversationId: "conv-11",
      status: "COMPLETED",
      assistantMessage: "Ready",
    });
    (AgentApi.prototype as any).getAgentChatExecution = getExecutionSpy;

    const result = await getChatAgentExecution("agent-11", "exec-11");

    expect(result).toEqual({
      executionId: "exec-11",
      conversationId: "conv-11",
      status: "COMPLETED",
      reply: "Ready",
      errorMessage: undefined,
      failureClass: undefined,
      reason: undefined,
      retryable: undefined,
    });
  });

  it("maps failed lifecycle response with error metadata", async () => {
    const getExecutionSpy = vi.fn().mockResolvedValue({
      executionId: "exec-12",
      conversationId: "conv-12",
      status: "FAILED",
      error: {
        failureClass: "TIMEOUT",
        reason: "Execution timed out",
        retryable: true,
      },
    });
    (AgentApi.prototype as any).getAgentChatExecution = getExecutionSpy;

    const result = await getChatAgentExecution("agent-11", "exec-12", "conv-12");

    expect(result).toEqual({
      executionId: "exec-12",
      conversationId: "conv-12",
      status: "FAILED",
      reply: undefined,
      errorMessage: "Execution timed out",
      failureClass: "TIMEOUT",
      reason: "Execution timed out",
      retryable: true,
    });
  });
});

describe("agentsApi.deleteConversation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls generated deleteAgentConversation when method exists", async () => {
    const deleteConversationSpy = vi.fn().mockResolvedValue(undefined);
    (AgentApi.prototype as any).deleteAgentConversation = deleteConversationSpy;

    await deleteAgentConversation("conv-1");

    expect(deleteConversationSpy).toHaveBeenCalledWith({ conversationId: "conv-1" });
  });

  it("throws explicit error when delete endpoint is missing in generated api", async () => {
    (AgentApi.prototype as any).deleteAgentConversation = undefined;
    (AgentApi.prototype as any).deleteConversation = undefined;

    await expect(deleteAgentConversation("conv-3")).rejects.toThrow(
      "Delete conversation endpoint is not available in current API package."
    );
  });
});

describe("agentsApi.chat execution wrappers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps queued submit response to accepted state", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-20",
      conversationId: "conv-20",
      inputMessageId: "msg-user-20",
      status: "QUEUED",
    });

    const result = await submitChatExecution("agent-20", { message: "hello" });

    expect(result).toEqual({
      executionId: "exec-20",
      state: "ACCEPTED",
      conversationId: "conv-20",
      inputMessageId: "msg-user-20",
      lifecycleStatus: "QUEUED",
    });
  });

  it("keeps inputMessageId undefined when inputMessageId is absent", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-20b",
      conversationId: "conv-20b",
      status: "QUEUED",
    });

    const result = await submitChatExecution("agent-20", { message: "hello" });

    expect(result).toEqual({
      executionId: "exec-20b",
      state: "ACCEPTED",
      conversationId: "conv-20b",
      inputMessageId: undefined,
      lifecycleStatus: "QUEUED",
    });
  });

  it("maps running submit response to in-progress state", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-21",
      conversationId: "conv-21",
      status: "RUNNING",
    });

    const result = await submitChatExecution("agent-20", { message: "hello" });

    expect(result.state).toBe("IN_PROGRESS");
  });

  it("maps completed submit response to completed state", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-22",
      conversationId: "conv-22",
      status: "COMPLETED",
    });

    const result = await submitChatExecution("agent-20", { message: "hello" });

    expect(result.state).toBe("COMPLETED");
  });

  it("maps failed submit response to failed state", async () => {
    (AgentApi.prototype as any).submitAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-23",
      conversationId: "conv-23",
      status: "FAILED",
    });

    const result = await submitChatExecution("agent-20", { message: "hello" });

    expect(result.state).toBe("FAILED");
  });

  it("maps completed execution status and keeps reply", async () => {
    (AgentApi.prototype as any).getAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-30",
      conversationId: "conv-30",
      status: "COMPLETED",
      assistantMessage: "Done",
    });

    const result = await getChatExecutionStatus("agent-30", "exec-30", "conv-fallback");

    expect(result).toEqual({
      executionId: "exec-30",
      state: "COMPLETED",
      conversationId: "conv-30",
      reply: "Done",
    });
  });

  it("maps failed execution status and keeps fallback error defaults", async () => {
    (AgentApi.prototype as any).getAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-31",
      conversationId: "conv-31",
      status: "FAILED",
      error: {
        failureClass: "BUSINESS_VALIDATION",
        reason: "Invalid context",
        retryable: false,
      },
    });

    const result = await getChatExecutionStatus("agent-30", "exec-31", "conv-fallback");

    expect(result).toEqual({
      executionId: "exec-31",
      state: "FAILED",
      conversationId: "conv-31",
      failure: {
        code: "BUSINESS_VALIDATION",
        message: "Invalid context",
        details: "Invalid context",
      },
    });
  });

  it("maps failed execution with missing details to defaults", async () => {
    (AgentApi.prototype as any).getAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-32",
      conversationId: "conv-32",
      status: "FAILED",
    });

    const result = await getChatExecutionStatus("agent-30", "exec-32", "conv-fallback");

    expect(result).toEqual({
      executionId: "exec-32",
      state: "FAILED",
      conversationId: "conv-32",
      failure: {
        code: "EXECUTION_ERROR",
        message: "The assistant could not complete this request.",
        details: undefined,
      },
    });
  });

  it("maps running execution to in-progress state", async () => {
    (AgentApi.prototype as any).getAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-33",
      conversationId: "conv-33",
      status: "RUNNING",
    });

    const result = await getChatExecutionStatus("agent-30", "exec-33", "conv-fallback");

    expect(result).toEqual({
      executionId: "exec-33",
      state: "IN_PROGRESS",
      conversationId: "conv-33",
    });
  });

  it("maps pending execution to accepted state and uses fallback conversation id", async () => {
    (AgentApi.prototype as any).getAgentChatExecution = vi.fn().mockResolvedValue({
      executionId: "exec-34",
      status: "ACCEPTED",
    });

    const result = await getChatExecutionStatus("agent-30", "exec-34", "conv-fallback");

    expect(result).toEqual({
      executionId: "exec-34",
      state: "ACCEPTED",
      conversationId: "conv-fallback",
    });
  });
});

describe("agentsApi.rules", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns rules list and forwards optional filters", async () => {
    const getRulesSpy = vi.fn().mockResolvedValue({ items: [{ id: "rule-1" }] });
    (AgentApi.prototype as any).getAgentRules = getRulesSpy;

    const result = await getAgentRules("agent-1", { status: "PENDING", authorType: "AI" });

    expect(getRulesSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      status: "PENDING",
      authorType: "AI",
    });
    expect(result).toEqual([{ id: "rule-1" }]);
  });

  it("returns empty list when get rules response has no items", async () => {
    (AgentApi.prototype as any).getAgentRules = vi.fn().mockResolvedValue({});
    await expect(getAgentRules("agent-1")).resolves.toEqual([]);
  });

  it("creates rule with trimmed title and content", async () => {
    const createRuleSpy = vi.fn().mockResolvedValue({ id: "rule-1" });
    (AgentApi.prototype as any).createAgentRule = createRuleSpy;

    const result = await createAgentRule("agent-1", {
      title: "  Validation  ",
      content: "  Always validate input  ",
    });

    expect(createRuleSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      createAgentRuleRequestDTO: {
        title: "Validation",
        content: "Always validate input",
      },
    });
    expect(result).toEqual({ id: "rule-1" });
  });

  it("rejects create rule when title is blank", async () => {
    await expect(createAgentRule("agent-1", { title: " ", content: "content" })).rejects.toThrow(
      "Rule title is required"
    );
  });

  it("patches rule title and content", async () => {
    const patchRuleSpy = vi.fn().mockResolvedValue({ id: "rule-1" });
    (AgentApi.prototype as any).patchAgentRule = patchRuleSpy;

    await patchAgentRule("agent-1", "rule-1", {
      title: "  Updated title  ",
      content: "  Updated content  ",
    });

    expect(patchRuleSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      ruleId: "rule-1",
      patchAgentRuleRequestDTO: {
        title: "Updated title",
        content: "Updated content",
      },
    });
  });

  it("rejects patch rule with empty payload", async () => {
    await expect(patchAgentRule("agent-1", "rule-1", {})).rejects.toThrow(
      "At least one field (title or content) must be provided"
    );
  });

  it("accepts rule without body by default", async () => {
    const acceptRuleSpy = vi.fn().mockResolvedValue({ id: "rule-1" });
    (AgentApi.prototype as any).acceptAgentRule = acceptRuleSpy;

    await acceptAgentRule("agent-1", "rule-1");

    expect(acceptRuleSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      ruleId: "rule-1",
      acceptAgentRuleRequestDTO: undefined,
    });
  });

  it("accepts rule with trimmed update payload", async () => {
    const acceptRuleSpy = vi.fn().mockResolvedValue({ id: "rule-1" });
    (AgentApi.prototype as any).acceptAgentRule = acceptRuleSpy;

    await acceptAgentRule("agent-1", "rule-1", {
      title: "  Updated title  ",
      content: "  Updated content  ",
    });

    expect(acceptRuleSpy).toHaveBeenCalledWith({
      agentId: "agent-1",
      ruleId: "rule-1",
      acceptAgentRuleRequestDTO: {
        title: "Updated title",
        content: "Updated content",
      },
    });
  });

  it("rejects rule and forwards ids", async () => {
    const rejectRuleSpy = vi.fn().mockResolvedValue({ id: "rule-1" });
    (AgentApi.prototype as any).rejectAgentRule = rejectRuleSpy;

    await rejectAgentRule("agent-1", "rule-1");

    expect(rejectRuleSpy).toHaveBeenCalledWith({ agentId: "agent-1", ruleId: "rule-1" });
  });

  it("deletes rule and forwards ids", async () => {
    const deleteRuleSpy = vi.fn().mockResolvedValue({ status: "DELETED" });
    (AgentApi.prototype as any).deleteAgentRule = deleteRuleSpy;

    const result = await deleteAgentRule("agent-1", "rule-1");

    expect(deleteRuleSpy).toHaveBeenCalledWith({ agentId: "agent-1", ruleId: "rule-1" });
    expect(result).toEqual({ status: "DELETED" });
  });
});
