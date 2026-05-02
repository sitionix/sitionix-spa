import { AgentApi } from "@sitionix/app-afesox-bffssox-frontend-stable/apis";
import type {
  AcceptAgentRuleRequestDTO,
  CreateAgentRequestDTO,
  CreateAgentRuleRequestDTO,
  PatchAgentRuleRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";
import { bffApiConfiguration } from "../../../../../shared/http/httpClient";
import type {
  AgentConversationDetails,
  AgentConversationsResponse,
  AgentRule,
  AgentRuleAuthorType,
  AgentRuleStatus,
  AutomationAgent,
  ChatAgentAcceptedResponse,
  ChatAgentRequest,
  ChatAgentResponse,
  ChatExecutionResult,
  ChatExecutionStatusResponse,
  CreateAgentRuleRequest,
  DeleteAgentRuleResponse,
  PatchAgentRuleRequest,
  CreateAgentRequest,
  PatchAgentRequest,
  SubmitChatExecutionResponse,
} from "../model/types";

const agentApi = new AgentApi(bffApiConfiguration);
type RuleTextPayload = { title?: string; content?: string };
type ExtendedAgentApi = {
  restoreAgent(request: { agentId: string }): Promise<AutomationAgent>;
  deleteAgent(request: { agentId: string }): Promise<AutomationAgent>;
  getAgentConversations(request: { agentId: string }): Promise<AgentConversationsResponse>;
  getAgentConversation(request: { conversationId: string }): Promise<AgentConversationDetails>;
  submitAgentChatExecution?(request: {
    agentId: string;
    chatAgentRequestDTO: ChatAgentRequest;
    idempotencyKey?: string;
  }): Promise<{
    executionId: string;
    conversationId: string;
    status: "ACCEPTED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    error?: { failureClass: ChatExecutionResult["failureClass"]; reason: string; retryable: boolean } | null;
  }>;
  submitAgentChatExecutionByExecutionsPath?(request: {
    agentId: string;
    chatAgentRequestDTO: ChatAgentRequest;
    idempotencyKey?: string;
  }): Promise<{
    executionId: string;
    conversationId: string;
    status: "ACCEPTED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    error?: { failureClass: ChatExecutionResult["failureClass"]; reason: string; retryable: boolean } | null;
  }>;
  getAgentChatExecution?(request: {
    agentId: string;
    executionId: string;
    conversationId?: string;
  }): Promise<{
    executionId: string;
    conversationId: string;
    status: "ACCEPTED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    error?: { failureClass: ChatExecutionResult["failureClass"]; reason: string; retryable: boolean } | null;
    assistantMessage?: ChatExecutionResult["reply"] | null;
  }>;
  getAgentRules(request: { agentId: string; status?: AgentRuleStatus; authorType?: AgentRuleAuthorType }): Promise<{ items?: AgentRule[] }>;
  createAgentRule(request: { agentId: string; createAgentRuleRequestDTO: CreateAgentRuleRequestDTO }): Promise<AgentRule>;
  patchAgentRule(request: { agentId: string; ruleId: string; patchAgentRuleRequestDTO: PatchAgentRuleRequestDTO }): Promise<AgentRule>;
  acceptAgentRule(request: { agentId: string; ruleId: string; acceptAgentRuleRequestDTO?: AcceptAgentRuleRequestDTO }): Promise<AgentRule>;
  rejectAgentRule(request: { agentId: string; ruleId: string }): Promise<AgentRule>;
  deleteAgentRule(request: { agentId: string; ruleId: string }): Promise<DeleteAgentRuleResponse>;
};

const agentApiExtended = agentApi as unknown as ExtendedAgentApi;

function hasOwn(source: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function getRequiredTrimmed(value: string | undefined, errorMessage: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    throw new Error(errorMessage);
  }
  return normalized;
}

function getOptionalTrimmedField(
  payload: RuleTextPayload,
  field: keyof RuleTextPayload,
  errorMessage: string,
): string | undefined {
  if (!hasOwn(payload, field)) {
    return undefined;
  }
  return getRequiredTrimmed(payload[field], errorMessage);
}

function normalizeLifecycleStatus(
  status: string | undefined,
): "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" {
  if (status === "RUNNING") {
    return "RUNNING";
  }
  if (status === "COMPLETED") {
    return "SUCCEEDED";
  }
  if (status === "FAILED") {
    return "FAILED";
  }
  return "PENDING";
}

function generateUuidV4Fallback(): string {
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
}

function resolveClientRequestId(provided?: string): string {
  if (provided?.trim()) {
    return provided.trim();
  }
  const maybeCrypto = globalThis.crypto as Crypto | undefined;
  if (maybeCrypto?.randomUUID) {
    return maybeCrypto.randomUUID();
  }
  return generateUuidV4Fallback();
}

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

  if (hasOwn(payload, "name")) {
    const name = payload.name?.trim() ?? "";
    if (!name) {
      throw new Error("Agent name is required");
    }
    requestBody.name = name;
  }

  if (hasOwn(payload, "description")) {
    const rawDescription = payload.description;
    if (rawDescription === null) {
      requestBody.description = null;
    } else {
      const description = rawDescription?.trim() ?? "";
      requestBody.description = description || null;
    }
  }

  if (hasOwn(payload, "instruction")) {
    const instruction = payload.instruction?.trim() ?? "";
    if (!instruction) {
      throw new Error("Agent instruction is required");
    }
    requestBody.instruction = instruction;
  }

  if (!hasOwn(requestBody, "name")
    && !hasOwn(requestBody, "description")
    && !hasOwn(requestBody, "instruction")) {
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
  const latestExecution = (response as AgentConversationDetails).latestExecution;
  return {
    ...response,
    messages: Array.isArray(response.messages) ? response.messages : [],
    latestExecution: latestExecution
      ? {
        executionId: latestExecution.executionId,
        status: normalizeLifecycleStatus(latestExecution.status),
        errorCode: latestExecution.errorCode,
        errorMessage: latestExecution.errorMessage,
      }
      : undefined,
    assistantPending: typeof (response as AgentConversationDetails).assistantPending === "boolean"
      ? (response as AgentConversationDetails).assistantPending
      : undefined,
  };
}

export async function chatAgent(agentId: string, payload: ChatAgentRequest): Promise<ChatAgentResponse> {
  const normalizedMessage = payload.message.trim();
  if (!normalizedMessage) {
    throw new Error("Message is required");
  }

  const requestBody: ChatAgentRequest = {
    clientRequestId: resolveClientRequestId(payload.clientRequestId),
    message: normalizedMessage,
  };

  if (payload.conversationId) {
    requestBody.conversationId = payload.conversationId;
  }

  if (typeof agentApiExtended.submitAgentChatExecution === "function") {
    const response = await agentApiExtended.submitAgentChatExecution({
      agentId,
      chatAgentRequestDTO: requestBody,
      idempotencyKey: requestBody.clientRequestId,
    });
    const normalizedStatus: ChatAgentAcceptedResponse["status"] = normalizeLifecycleStatus(response.status);
    return {
      executionId: response.executionId,
      conversationId: response.conversationId,
      status: normalizedStatus,
    } satisfies ChatAgentAcceptedResponse;
  }

  if (typeof agentApiExtended.submitAgentChatExecutionByExecutionsPath !== "function") {
    throw new Error("Async chat execution endpoint is not available in current API package.");
  }

  const response = await agentApiExtended.submitAgentChatExecutionByExecutionsPath({
    agentId,
    chatAgentRequestDTO: requestBody,
    idempotencyKey: requestBody.clientRequestId,
  });
  const normalizedStatus: ChatAgentAcceptedResponse["status"] = normalizeLifecycleStatus(response.status);
  return {
    executionId: response.executionId,
    conversationId: response.conversationId,
    status: normalizedStatus,
  } satisfies ChatAgentAcceptedResponse;
}

export async function getChatAgentExecution(agentId: string, executionId: string, conversationId?: string): Promise<ChatExecutionResult> {
  if (typeof agentApiExtended.getAgentChatExecution !== "function") {
    throw new Error("Chat execution status endpoint is not available in current API package.");
  }
  const response = await agentApiExtended.getAgentChatExecution({ agentId, executionId, conversationId });
  const normalizedStatus: ChatExecutionResult["status"] = normalizeLifecycleStatus(response.status);
  return {
    executionId: response.executionId,
    conversationId: response.conversationId,
    status: normalizedStatus,
    reply: response.assistantMessage ?? undefined,
    errorMessage: response.error?.reason,
    failureClass: response.error?.failureClass,
    reason: response.error?.reason,
    retryable: response.error?.retryable,
  };
}

export async function submitChatExecution(agentId: string, payload: ChatAgentRequest): Promise<SubmitChatExecutionResponse> {
  const response = await chatAgent(agentId, payload);
  let state: SubmitChatExecutionResponse["state"] = "ACCEPTED";
  if (response.status === "RUNNING") {
    state = "IN_PROGRESS";
  } else if (response.status === "SUCCEEDED") {
    state = "SUCCEEDED";
  } else if (response.status === "FAILED") {
    state = "FAILED";
  }
  return {
    executionId: response.executionId,
    state,
    conversationId: response.conversationId ?? "",
  };
}

export async function getChatExecutionStatus(
  agentId: string,
  executionId: string,
  conversationId: string,
): Promise<ChatExecutionStatusResponse> {
  const execution = await getChatAgentExecution(agentId, executionId, conversationId);
  if (execution.status === "SUCCEEDED") {
    return {
      executionId,
      state: "SUCCEEDED",
      conversationId: execution.conversationId ?? conversationId,
      reply: execution.reply,
    };
  }
  if (execution.status === "FAILED") {
    return {
      executionId,
      state: "FAILED",
      conversationId: execution.conversationId ?? conversationId,
      failure: {
        code: execution.failureClass ?? "EXECUTION_ERROR",
        message: execution.errorMessage ?? "The assistant could not complete this request.",
        details: execution.reason,
      },
    };
  }
  return {
    executionId,
    state: execution.status === "RUNNING" ? "IN_PROGRESS" : "ACCEPTED",
    conversationId: execution.conversationId ?? conversationId,
  };
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
  const title = getRequiredTrimmed(payload.title, "Rule title is required");
  const content = getRequiredTrimmed(payload.content, "Rule content is required");
  return agentApiExtended.createAgentRule({
    agentId,
    createAgentRuleRequestDTO: { title, content },
  });
}

export async function patchAgentRule(agentId: string, ruleId: string, payload: PatchAgentRuleRequest): Promise<AgentRule> {
  const requestBody: PatchAgentRuleRequestDTO = {};
  const title = getOptionalTrimmedField(payload, "title", "Rule title is required");
  if (title !== undefined) {
    requestBody.title = title;
  }
  const content = getOptionalTrimmedField(payload, "content", "Rule content is required");
  if (content !== undefined) {
    requestBody.content = content;
  }
  if (!hasOwn(requestBody, "title")
    && !hasOwn(requestBody, "content")) {
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
  if (payload && (hasOwn(payload, "title")
      || hasOwn(payload, "content"))) {
    requestBody = {};
    const title = getOptionalTrimmedField(payload, "title", "Rule title is required");
    if (title !== undefined) {
      requestBody.title = title;
    }
    const content = getOptionalTrimmedField(payload, "content", "Rule content is required");
    if (content !== undefined) {
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
  getChatAgentExecution,
  submitChatExecution,
  getChatExecutionStatus,
  getAgentRules,
  createAgentRule,
  patchAgentRule,
  acceptAgentRule,
  rejectAgentRule,
  deleteAgentRule,
  getErrorHttpStatus,
};
