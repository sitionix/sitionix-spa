import type { ApiError } from "@sitionix/contracts";
import { requestJson } from "../../../../../shared/http/httpClient";
import type { AutomationAgent, CreateAgentRequest } from "../model/types";

type AgentsApiResponse = {
  items: AutomationAgent[];
};

export async function getAgents(): Promise<AutomationAgent[]> {
  const result = await requestJson<AgentsApiResponse, ApiError, undefined>({
    method: "GET",
    path: "/api/v1/agents",
  });

  if (!result.ok) {
    throw result.error ?? new Error("Get agents request failed");
  }

  return Array.isArray(result.data.items) ? result.data.items : [];
}

export async function createAgent(payload: CreateAgentRequest): Promise<AutomationAgent> {
  const name = payload.name.trim();
  const description = payload.description.trim();

  if (!name) {
    throw new Error("Agent name is required");
  }
  if (!description) {
    throw new Error("Agent description is required");
  }

  const result = await requestJson<AutomationAgent, ApiError, CreateAgentRequest>({
    method: "POST",
    path: "/api/v1/agents",
    body: {
      name,
      description,
    },
  });

  if (!result.ok) {
    throw result.error ?? new Error("Create agent request failed");
  }

  return result.data;
}

export const agentsApi = {
  getAgents,
  createAgent,
};
