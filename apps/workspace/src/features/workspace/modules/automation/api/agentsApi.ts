import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";
import type {
  CreateAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";
import { bffApiConfiguration } from "../../../../../shared/http/httpClient";
import type { AutomationAgent, CreateAgentRequest } from "../model/types";

const agentApi = new AgentApi(bffApiConfiguration);

export async function getAgents(): Promise<AutomationAgent[]> {
  const response = await agentApi.getAgents();
  return Array.isArray(response.items) ? response.items : [];
}

export async function getAgentById(agentId: string): Promise<AutomationAgent> {
  return agentApi.getAgent({ agentId });
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

  const response = await agentApi.createAgent({
    createAgentRequestDTO: requestBody,
  });

  return response;
}

type ErrorWithStatus = {
  status?: unknown;
  response?: {
    status?: unknown;
  };
};

export function getErrorHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const errorWithStatus = error as ErrorWithStatus;
  if (typeof errorWithStatus.status === "number") {
    return errorWithStatus.status;
  }

  if (typeof errorWithStatus.response?.status === "number") {
    return errorWithStatus.response.status;
  }

  return null;
}

export const agentsApi = {
  getAgents,
  getAgentById,
  createAgent,
  getErrorHttpStatus,
};
