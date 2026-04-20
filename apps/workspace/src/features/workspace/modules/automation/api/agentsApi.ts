import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";
import type {
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";
import { bffApiConfiguration, requestJson } from "../../../../../shared/http/httpClient";
import type {
  AutomationAgent,
  ChatAgentRequest,
  ChatAgentResponse,
  CreateAgentRequest,
  PatchAgentRequest,
} from "../model/types";

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
  const description = payload.description?.trim();

  if (!name) {
    throw new Error("Agent name is required");
  }

  const requestBody: CreateAgentRequestDTO = {
    name,
  };
  if (description) {
    requestBody.description = description;
  }

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
    const rawDescription = payload.description;
    if (rawDescription === null) {
      requestBody.description = null;
    } else {
      const description = rawDescription?.trim() ?? "";
      requestBody.description = description || null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "instruction")) {
    const instruction = payload.instruction?.trim() ?? "";
    if (!instruction) {
      throw new Error("Agent instruction is required");
    }
    requestBody.instruction = instruction;
  }

  if (!Object.prototype.hasOwnProperty.call(requestBody, "name")
    && !Object.prototype.hasOwnProperty.call(requestBody, "description")
    && !Object.prototype.hasOwnProperty.call(requestBody, "instruction")) {
    throw new Error("At least one field (name, description or instruction) must be provided");
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

export async function restoreAgent(agentId: string): Promise<AutomationAgent> {
  const result = await requestJson<AutomationAgent, unknown, undefined>({
    method: "POST",
    path: `/api/v1/agents/${agentId}/restore`,
  });

  if (result.ok) {
    return result.data;
  }

  throw result.error ?? new Error("Failed to restore agent");
}

export async function deleteAgent(agentId: string): Promise<AutomationAgent> {
  const result = await requestJson<AutomationAgent, unknown, undefined>({
    method: "DELETE",
    path: `/api/v1/agents/${agentId}`,
  });

  if (result.ok) {
    return result.data;
  }

  throw result.error ?? new Error("Failed to delete agent");
}

export async function chatAgent(agentId: string, message: string): Promise<ChatAgentResponse> {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new Error("Message is required");
  }

  const requestBody: ChatAgentRequest = {
    message: normalizedMessage,
  };

  const result = await requestJson<ChatAgentResponse, ChatAgentRequest, undefined>({
    method: "POST",
    path: `/api/v1/agents/${agentId}/chat`,
    body: requestBody,
  });
  if (result.ok) {
    return result.data;
  }

  throw result.error ?? new Error("Failed to chat with agent");
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
  restoreAgent,
  deleteAgent,
  chatAgent,
  getErrorHttpStatus,
};
