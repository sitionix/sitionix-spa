import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../../../../shared/http/httpClient";
import { createAgent, getAgents } from "../../../../features/workspace/api/agentsApi";

vi.mock("../../../../shared/http/httpClient", () => ({
  requestJson: vi.fn(),
}));

const requestJsonMock = vi.mocked(requestJson);

describe("agentsApi.getAgents", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
  });

  it("returns agent items from successful response", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
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
      },
    });

    const result = await getAgents();

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/agents",
    });
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
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: undefined,
      },
    });

    const result = await getAgents();

    expect(result).toEqual([]);
  });

  it("throws api error when request fails", async () => {
    const apiError = {
      code: 401,
      title: "Unauthorized",
      details: "Missing bearer token",
    };

    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: apiError,
    });

    await expect(getAgents()).rejects.toEqual(apiError);
  });

  it("throws default error when request fails without api payload", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: undefined,
    });

    await expect(getAgents()).rejects.toThrow("Get agents request failed");
  });
});

describe("agentsApi.createAgent", () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
  });

  it("trims fields and returns created agent", async () => {
    requestJsonMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        id: "agent-2",
        name: "Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    });

    const result = await createAgent({
      name: "  Agent  ",
      description: "  Description  ",
    });

    expect(requestJsonMock).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/v1/agents",
      body: {
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
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("throws when description is blank", async () => {
    await expect(createAgent({ name: "agent", description: "  " })).rejects.toThrow(
      "Agent description is required"
    );
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("throws default error when create request fails without api payload", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: undefined,
    });

    await expect(createAgent({ name: "agent", description: "desc" })).rejects.toThrow(
      "Create agent request failed"
    );
  });
});
