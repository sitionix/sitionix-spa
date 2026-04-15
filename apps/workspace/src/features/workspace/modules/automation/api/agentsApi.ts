import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-113-unstable/apis";
import type {
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-113-unstable/models";
import { bffApiConfiguration } from "../../../../../shared/http/httpClient";
import type { AutomationAgent, CreateAgentRequest, PatchAgentRequest } from "../model/types";

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

export async function patchAgent(agentId: string, payload: PatchAgentRequest): Promise<AutomationAgent> {
  const requestBody: PatchAgentRequestDTO = {};

  if (Object.prototype.hasOwnProperty.call(payload, "name")) {
    const name = payload.name?.trim() ?? "";
    if (!name) {
      throw new Error("Agent name is required");
    }
    requestBody.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    const description = payload.description?.trim() ?? "";
    if (!description) {
      throw new Error("Agent description is required");
    }
    requestBody.description = description;
  }

  if (!Object.prototype.hasOwnProperty.call(requestBody, "name")
    && !Object.prototype.hasOwnProperty.call(requestBody, "description")) {
    throw new Error("At least one field (name or description) must be provided");
  }

  const response = await agentApi.patchAgent({
    agentId,
    patchAgentRequestDTO: requestBody,
  });

  return response;
}

export async function activateAgent(agentId: string): Promise<AutomationAgent> {
  return agentApi.activateAgent({ agentId });
}

export async function archiveAgent(agentId: string): Promise<AutomationAgent> {
  return agentApi.archiveAgent({ agentId });
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
  patchAgent,
  activateAgent,
  archiveAgent,
  getErrorHttpStatus,
};
