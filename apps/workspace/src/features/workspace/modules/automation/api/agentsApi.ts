import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/apis";
import type {
  CreateAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";
import { bffApiConfiguration } from "../../../../../shared/http/httpClient";
import type { AutomationAgent, CreateAgentRequest } from "../model/types";

const agentApi = new AgentApi(bffApiConfiguration);

export async function getAgents(): Promise<AutomationAgent[]> {
  const response = await agentApi.getAgents();
  return Array.isArray(response.items) ? response.items : [];
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

export const agentsApi = {
  getAgents,
  createAgent,
};
