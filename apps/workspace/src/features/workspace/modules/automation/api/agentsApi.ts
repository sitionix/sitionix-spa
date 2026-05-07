import { AgentApi, AgentChatApi, AgentConversationApi } from "@sitionix/app-afesox-bffssox-frontend-sitionix-134-unstable/apis";
import type {
  AcceptAgentRuleRequestDTO,
  CreateAgentRequestDTO,
  CreateAgentProjectRequestDTO,
  CreateAgentRuleRequestDTO,
  PatchAgentRuleRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-134-unstable/models";
import { bffApiConfiguration, requestJson } from "../../../../../shared/http/httpClient";
import type {
  AgentConversationDetails,
  AgentConversationsResponse,
  AgentRule,
  AgentRuleAuthorType,
  AgentRuleStatus,
  AddAgentToProjectRequest,
  AutomationAgent,
  ChatAgentAcceptedResponse,
  ChatAgentRequest,
  ChatAgentResponse,
  ChatExecutionResult,
  ChatExecutionStatusResponse,
  CreateAgentProjectRequest,
  CreateAgentRuleRequest,
  AgentProject,
  AgentProjectsPage,
  DeleteAgentRuleResponse,
  PatchAgentRuleRequest,
  CreateAgentRequest,
  PatchAgentRequest,
  PatchAgentProjectRequest,
  ProjectAgent,
  ProjectAgentsResponse,
  SubmitChatExecutionResponse,
} from "../model/types";

const agentApi = new AgentApi(bffApiConfiguration);
const agentConversationApi = new AgentConversationApi(bffApiConfiguration);
const agentChatApi = new AgentChatApi(bffApiConfiguration);
type RuleTextPayload = { title?: string; content?: string };
type ExtendedAgentApi = {
  restoreAgent(request: { agentId: string }): Promise<AutomationAgent>;
  deleteAgent(request: { agentId: string }): Promise<AutomationAgent>;
  getAgentRules(request: { agentId: string; status?: AgentRuleStatus; authorType?: AgentRuleAuthorType }): Promise<{ items?: AgentRule[] }>;
  createAgentRule(request: { agentId: string; createAgentRuleRequestDTO: CreateAgentRuleRequestDTO }): Promise<AgentRule>;
  patchAgentRule(request: { agentId: string; ruleId: string; patchAgentRuleRequestDTO: PatchAgentRuleRequestDTO }): Promise<AgentRule>;
  acceptAgentRule(request: { agentId: string; ruleId: string; acceptAgentRuleRequestDTO?: AcceptAgentRuleRequestDTO }): Promise<AgentRule>;
  rejectAgentRule(request: { agentId: string; ruleId: string }): Promise<AgentRule>;
  deleteAgentRule(request: { agentId: string; ruleId: string }): Promise<DeleteAgentRuleResponse>;
};

const agentApiExtended = agentApi as unknown as ExtendedAgentApi;
const agentConversationApiExtended = agentConversationApi as unknown as {
  getAgentConversations(request: { agentId: string }): Promise<AgentConversationsResponse>;
  getAgentConversation(request: { conversationId: string }): Promise<AgentConversationDetails>;
  deleteAgentConversation?(request: { conversationId: string }): Promise<void>;
};
const agentChatApiExtended = agentChatApi as unknown as {
  submitAgentChatExecution?(request: {
    agentId: string;
    chatAgentRequestDTO: ChatAgentRequest;
    idempotencyKey?: string;
  }): Promise<{
    executionId: string;
    conversationId: string;
    inputMessageId?: string;
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
    inputMessageId?: string;
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
};

function createHttpStatusError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

function buildProjectsPath(page: number, size: number): string {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return `/api/v1/agent-projects?${query.toString()}`;
}

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
): "QUEUED" | "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" {
  if (status === "QUEUED") {
    return "QUEUED";
  }
  if (status === "RUNNING" || status === "IN_PROGRESS") {
    return "RUNNING";
  }
  if (status === "COMPLETED" || status === "SUCCEEDED") {
    return "COMPLETED";
  }
  if (status === "FAILED") {
    return "FAILED";
  }
  return "PENDING";
}

function resolveInputMessageId(source: { inputMessageId?: string }): string | undefined {
  if (typeof source.inputMessageId === "string" && source.inputMessageId.trim()) {
    return source.inputMessageId;
  }
  return undefined;
}

function resolveClientRequestId(provided?: string): string {
  if (provided?.trim()) {
    return provided.trim();
  }
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  throw new Error("crypto.randomUUID is unavailable. Unable to generate clientRequestId.");
}

export async function getAgents(): Promise<AutomationAgent[]> {
  const response = await agentApi.getAgents();
  return Array.isArray(response.items) ? response.items : [];
}

export async function getAgentById(agentId: string): Promise<AutomationAgent> {
  return agentApi.getAgent({ agentId });
}

export async function getAgentProjects(page = 0, size = 20): Promise<AgentProjectsPage> {
  const result = await requestJson<AgentProjectsPage, unknown, never>({
    method: "GET",
    path: buildProjectsPath(page, size),
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to load projects");
  }
  const response = result.data;
  return {
    ...response,
    items: Array.isArray(response.items) ? response.items : [],
  };
}

export async function getAgentProject(projectId: string): Promise<AgentProject> {
  const result = await requestJson<AgentProject, unknown, never>({
    method: "GET",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}`,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to load project");
  }
  return result.data;
}

export async function patchAgentProject(projectId: string, payload: PatchAgentProjectRequest): Promise<AgentProject> {
  const requestBody: PatchAgentProjectRequest = {};

  if (hasOwn(payload, "name")) {
    const name = payload.name?.trim() ?? "";
    if (!name) {
      throw new Error("Project name is required");
    }
    requestBody.name = name;
  }

  if (hasOwn(payload, "context")) {
    const rawContext = payload.context;
    if (rawContext === null) {
      requestBody.context = null;
    } else {
      const context = rawContext?.trim() ?? "";
      requestBody.context = context || null;
    }
  }

  if (!hasOwn(requestBody, "name") && !hasOwn(requestBody, "context")) {
    throw new Error("At least one field (name or context) must be provided");
  }

  const result = await requestJson<AgentProject, unknown, PatchAgentProjectRequest>({
    method: "PATCH",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}`,
    body: requestBody,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to patch project");
  }
  return result.data;
}

export async function deleteAgentProject(projectId: string): Promise<void> {
  const result = await requestJson<undefined, unknown, never>({
    method: "DELETE",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}`,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to delete project");
  }
}

export async function listAgentProjectAgents(projectId: string): Promise<ProjectAgent[]> {
  const result = await requestJson<ProjectAgentsResponse, unknown, never>({
    method: "GET",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}/agents`,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to load project agents");
  }
  return Array.isArray(result.data.items) ? result.data.items : [];
}

export async function addAgentToProject(projectId: string, payload: AddAgentToProjectRequest): Promise<ProjectAgent> {
  const result = await requestJson<ProjectAgent, unknown, AddAgentToProjectRequest>({
    method: "POST",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}/agents`,
    body: payload,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to add agent to project");
  }
  return result.data;
}

export async function removeAgentFromProject(projectId: string, agentId: string): Promise<void> {
  const result = await requestJson<undefined, unknown, never>({
    method: "DELETE",
    path: `/api/v1/agent-projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentId)}`,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to remove agent from project");
  }
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

export async function createAgentProject(payload: CreateAgentProjectRequest): Promise<AgentProject> {
  const name = payload.name.trim();
  const description = payload.description?.trim();

  if (!name) {
    throw new Error("Project name is required");
  }

  const requestBody: CreateAgentProjectRequestDTO = {
    name,
  };

  if (description) {
    requestBody.description = description;
  }

  const result = await requestJson<AgentProject, unknown, CreateAgentProjectRequestDTO>({
    method: "POST",
    path: "/api/v1/agent-projects",
    body: requestBody,
  });
  if (!result.ok) {
    throw createHttpStatusError(result.status, "Unable to create project");
  }
  return result.data;
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
  const response = await agentConversationApiExtended.getAgentConversations({ agentId });
  return {
    items: Array.isArray(response.items) ? response.items : [],
  };
}

export async function getAgentConversation(conversationId: string): Promise<AgentConversationDetails> {
  const response = await agentConversationApiExtended.getAgentConversation({ conversationId });
  const rawExecutions = Array.isArray((response as { executions?: unknown[] }).executions)
    ? (response as { executions: Array<{
      executionId: string;
      status: string;
      acceptedAt: string;
      startedAt?: string | null;
      completedAt?: string | null;
      error?: { code?: string; message?: string } | null;
      assistantMessage?: AgentConversationDetails["messages"][number] | null;
    }> }).executions
    : [];
  return {
    ...response,
    messages: Array.isArray(response.messages) ? response.messages : [],
    executions: rawExecutions.map((execution) => ({
      executionId: execution.executionId,
      status: normalizeLifecycleStatus(execution.status),
      acceptedAt: execution.acceptedAt,
      startedAt: execution.startedAt ?? null,
      completedAt: execution.completedAt ?? null,
      errorCode: execution.error?.code,
      errorMessage: execution.error?.message,
      assistantMessage: execution.assistantMessage ?? undefined,
    })),
  };
}

export async function deleteAgentConversation(conversationId: string): Promise<void> {
  if (typeof agentConversationApiExtended.deleteAgentConversation !== "function") {
    throw new Error("Delete conversation endpoint is not available in current API package.");
  }
  await agentConversationApiExtended.deleteAgentConversation({ conversationId });
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

  if (typeof agentChatApiExtended.submitAgentChatExecution === "function") {
    const response = await agentChatApiExtended.submitAgentChatExecution({
      agentId,
      chatAgentRequestDTO: requestBody,
      idempotencyKey: requestBody.clientRequestId,
    });
    const normalizedStatus: ChatAgentAcceptedResponse["status"] = normalizeLifecycleStatus(response.status);
    return {
      executionId: response.executionId,
      conversationId: response.conversationId,
      inputMessageId: resolveInputMessageId(response),
      status: normalizedStatus,
    } satisfies ChatAgentAcceptedResponse;
  }

  if (typeof agentChatApiExtended.submitAgentChatExecutionByExecutionsPath !== "function") {
    throw new Error("Async chat execution endpoint is not available in current API package.");
  }

  const response = await agentChatApiExtended.submitAgentChatExecutionByExecutionsPath({
    agentId,
    chatAgentRequestDTO: requestBody,
    idempotencyKey: requestBody.clientRequestId,
  });
  const normalizedStatus: ChatAgentAcceptedResponse["status"] = normalizeLifecycleStatus(response.status);
  return {
    executionId: response.executionId,
    conversationId: response.conversationId,
    inputMessageId: resolveInputMessageId(response),
    status: normalizedStatus,
  } satisfies ChatAgentAcceptedResponse;
}

export async function getChatAgentExecution(agentId: string, executionId: string, conversationId?: string): Promise<ChatExecutionResult> {
  if (typeof agentChatApiExtended.getAgentChatExecution !== "function") {
    throw new Error("Chat execution status endpoint is not available in current API package.");
  }
  const response = await agentChatApiExtended.getAgentChatExecution({ agentId, executionId, conversationId });
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
  } else if (response.status === "COMPLETED") {
    state = "COMPLETED";
  } else if (response.status === "FAILED") {
    state = "FAILED";
  }
  return {
    executionId: response.executionId,
    state,
    conversationId: response.conversationId ?? "",
    inputMessageId: response.inputMessageId,
    lifecycleStatus: response.status,
  };
}

export async function getChatExecutionStatus(
  agentId: string,
  executionId: string,
  conversationId: string,
): Promise<ChatExecutionStatusResponse> {
  const execution = await getChatAgentExecution(agentId, executionId, conversationId);
  if (execution.status === "COMPLETED") {
    return {
      executionId,
      state: "COMPLETED",
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
  getAgentProject,
  patchAgentProject,
  deleteAgentProject,
  createAgent,
  patchAgent,
  activateAgent,
  archiveAgent,
  restoreAgent,
  deleteAgent,
  getAgentConversations,
  getAgentConversation,
  deleteAgentConversation,
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
