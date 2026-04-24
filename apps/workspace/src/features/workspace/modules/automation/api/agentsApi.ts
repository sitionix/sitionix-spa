import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-119-unstable/apis";
import type {
  AcceptAgentRuleRequestDTO,
  CreateAgentRequestDTO,
  CreateAgentRuleRequestDTO,
  PatchAgentRuleRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-119-unstable/models";
import { bffApiConfiguration } from "../../../../../shared/http/httpClient";
import type {
  AgentConversationDetails,
  AgentConversationsResponse,
  AgentRule,
  AgentRuleAuthorType,
  AgentRuleStatus,
  AutomationAgent,
  ChatAgentRequest,
  ChatAgentResponse,
  CreateAgentRuleRequest,
  DeleteAgentRuleResponse,
  PatchAgentRuleRequest,
  CreateAgentRequest,
  PatchAgentRequest,
} from "../model/types";

const agentApi = new AgentApi(bffApiConfiguration);
type ExtendedAgentApi = {
  restoreAgent(request: { agentId: string }): Promise<AutomationAgent>;
  deleteAgent(request: { agentId: string }): Promise<AutomationAgent>;
  getAgentConversations(request: { agentId: string }): Promise<AgentConversationsResponse>;
  getAgentConversation(request: { conversationId: string }): Promise<AgentConversationDetails>;
  chatAgent(request: { agentId: string; chatAgentRequestDTO: ChatAgentRequest }): Promise<ChatAgentResponse>;
  getAgentRules(request: { agentId: string; status?: AgentRuleStatus; authorType?: AgentRuleAuthorType }): Promise<{ items?: AgentRule[] }>;
  createAgentRule(request: { agentId: string; createAgentRuleRequestDTO: CreateAgentRuleRequestDTO }): Promise<AgentRule>;
  patchAgentRule(request: { agentId: string; ruleId: string; patchAgentRuleRequestDTO: PatchAgentRuleRequestDTO }): Promise<AgentRule>;
  acceptAgentRule(request: { agentId: string; ruleId: string; acceptAgentRuleRequestDTO?: AcceptAgentRuleRequestDTO }): Promise<AgentRule>;
  rejectAgentRule(request: { agentId: string; ruleId: string }): Promise<AgentRule>;
  deleteAgentRule(request: { agentId: string; ruleId: string }): Promise<DeleteAgentRuleResponse>;
};

const agentApiExtended = agentApi as unknown as ExtendedAgentApi;

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
  return agentApiExtended.restoreAgent({ agentId });
}

export async function deleteAgent(agentId: string): Promise<AutomationAgent> {
  return agentApiExtended.deleteAgent({ agentId });
}

export async function getAgentConversations(agentId: string): Promise<AgentConversationsResponse> {
  const response = await agentApiExtended.getAgentConversations({ agentId });
  return {
    items: Array.isArray(response.items) ? response.items : [],
  };
}

export async function getAgentConversation(conversationId: string): Promise<AgentConversationDetails> {
  const response = await agentApiExtended.getAgentConversation({ conversationId });
  return {
    ...response,
    messages: Array.isArray(response.messages) ? response.messages : [],
  };
}

export async function chatAgent(agentId: string, payload: ChatAgentRequest): Promise<ChatAgentResponse> {
  const normalizedMessage = payload.message.trim();
  if (!normalizedMessage) {
    throw new Error("Message is required");
  }

  const requestBody: ChatAgentRequest = {
    message: normalizedMessage,
  };

  if (payload.conversationId) {
    requestBody.conversationId = payload.conversationId;
  }

  return agentApiExtended.chatAgent({
    agentId,
    chatAgentRequestDTO: requestBody,
  });
}

export async function getAgentRules(
  agentId: string,
  filters?: { status?: AgentRuleStatus; authorType?: AgentRuleAuthorType },
): Promise<AgentRule[]> {
  const response = await agentApiExtended.getAgentRules({
    agentId,
    status: filters?.status,
    authorType: filters?.authorType,
  });
  return Array.isArray(response.items) ? response.items : [];
}

export async function createAgentRule(agentId: string, payload: CreateAgentRuleRequest): Promise<AgentRule> {
  const title = payload.title?.trim() ?? "";
  const content = payload.content?.trim() ?? "";
  if (!title) {
    throw new Error("Rule title is required");
  }
  if (!content) {
    throw new Error("Rule content is required");
  }
  return agentApiExtended.createAgentRule({
    agentId,
    createAgentRuleRequestDTO: { title, content },
  });
}

export async function patchAgentRule(agentId: string, ruleId: string, payload: PatchAgentRuleRequest): Promise<AgentRule> {
  const requestBody: PatchAgentRuleRequestDTO = {};
  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = payload.title?.trim() ?? "";
    if (!title) {
      throw new Error("Rule title is required");
    }
    requestBody.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "content")) {
    const content = payload.content?.trim() ?? "";
    if (!content) {
      throw new Error("Rule content is required");
    }
    requestBody.content = content;
  }
  if (!Object.prototype.hasOwnProperty.call(requestBody, "title")
    && !Object.prototype.hasOwnProperty.call(requestBody, "content")) {
    throw new Error("At least one field (title or content) must be provided");
  }
  return agentApiExtended.patchAgentRule({
    agentId,
    ruleId,
    patchAgentRuleRequestDTO: requestBody,
  });
}

export async function acceptAgentRule(
  agentId: string,
  ruleId: string,
  payload?: { title?: string; content?: string },
): Promise<AgentRule> {
  let requestBody: AcceptAgentRuleRequestDTO | undefined;
  if (payload && (Object.prototype.hasOwnProperty.call(payload, "title")
      || Object.prototype.hasOwnProperty.call(payload, "content"))) {
    requestBody = {};
    if (Object.prototype.hasOwnProperty.call(payload, "title")) {
      const title = payload.title?.trim() ?? "";
      if (!title) {
        throw new Error("Rule title is required");
      }
      requestBody.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "content")) {
      const content = payload.content?.trim() ?? "";
      if (!content) {
        throw new Error("Rule content is required");
      }
      requestBody.content = content;
    }
  }
  return agentApiExtended.acceptAgentRule({
    agentId,
    ruleId,
    acceptAgentRuleRequestDTO: requestBody,
  });
}

export async function rejectAgentRule(agentId: string, ruleId: string): Promise<AgentRule> {
  return agentApiExtended.rejectAgentRule({ agentId, ruleId });
}

export async function deleteAgentRule(agentId: string, ruleId: string): Promise<DeleteAgentRuleResponse> {
  return agentApiExtended.deleteAgentRule({ agentId, ruleId });
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
  getAgentConversations,
  getAgentConversation,
  chatAgent,
  getAgentRules,
  createAgentRule,
  patchAgentRule,
  acceptAgentRule,
  rejectAgentRule,
  deleteAgentRule,
  getErrorHttpStatus,
};
