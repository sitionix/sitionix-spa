import type {
  AgentDTO,
  AgentRuleDTO,
  CreateAgentRuleRequestDTO,
  PatchAgentRuleRequestDTO,
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;
export type PatchAgentRequest = PatchAgentRequestDTO;

export type ChatAgentRequest = {
  conversationId?: string;
  message: string;
};

export type ChatAgentMessage = {
  id: string;
  authorType: "USER" | "AGENT";
  authorId: string;
  content: string;
  createdAt: string;
};

export type ChatExecutionLifecycleStatus = "PENDING" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type ChatExecutionFailureClass = "OWNERSHIP_VIOLATION" | "CONVERSATION_NOT_FOUND" | "INVALID_LIFECYCLE_STATE" | "IDEMPOTENCY_CONFLICT" | "EXECUTION_ERROR";

export type ChatAgentAcceptedResponse = {
  executionId: string;
  conversationId?: string;
  status: ChatExecutionLifecycleStatus;
};

export type ChatAgentResponse = ChatAgentAcceptedResponse;

export type ChatExecutionResult = {
  executionId: string;
  conversationId?: string;
  status: ChatExecutionLifecycleStatus;
  reply?: ChatAgentMessage;
  errorMessage?: string;
  failureClass?: ChatExecutionFailureClass;
  reason?: string;
  retryable?: boolean;
};

export type ChatExecutionState = "accepted" | "queued" | "running" | "succeeded" | "failed";

export type ChatExecutionFailure = {
  code: string;
  message: string;
  details?: string;
};

export type SubmitChatExecutionResponse = {
  executionId: string;
  state: ChatExecutionState;
  conversationId: string;
};

export type ChatExecutionStatusResponse = {
  executionId: string;
  state: ChatExecutionState;
  conversationId: string;
  reply?: ChatAgentMessage;
  failure?: ChatExecutionFailure;
};

export type AgentRule = AgentRuleDTO;
export type CreateAgentRuleRequest = CreateAgentRuleRequestDTO;
export type PatchAgentRuleRequest = PatchAgentRuleRequestDTO;
export type AgentRuleStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DELETED";
export type AgentRuleAuthorType = "USER" | "AI";

export type DeleteAgentRuleResponse = {
  status: "DELETED";
};

export type AgentConversation = {
  id: string;
  title: string;
  type: "DIRECT";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type AgentConversationsResponse = {
  items: AgentConversation[];
};

export type AgentConversationDetails = {
  id: string;
  title: string;
  type: "DIRECT";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: ChatAgentMessage[];
};

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
