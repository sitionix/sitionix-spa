import type {
  AgentDTO,
  AgentsResponseDTO,
  CreateAgentRequestDTO,
  ErrorDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";
import { requestJson } from "../../../../../shared/http/httpClient";
import type { AutomationAgent, CreateAgentRequest } from "../model/types";

export async function getAgents(): Promise<AutomationAgent[]> {
  const result = await requestJson<AgentsResponseDTO, ErrorDTO, undefined>({
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

  const requestBody: CreateAgentRequestDTO = {
    name,
    description,
  };

  const result = await requestJson<AgentDTO, ErrorDTO, CreateAgentRequestDTO>({
    method: "POST",
    path: "/api/v1/agents",
    body: requestBody,
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
