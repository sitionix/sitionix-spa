import type {
  AddAgentToProjectRequestDTO,
  AgentDTO,
  AgentProjectDTO,
  AgentProjectsPageResponseDTO,
  ProjectAgentResponseDTO,
  ProjectAgentsResponseDTO,
  AgentRuleDTO,
  CreateAgentProjectRequestDTO,
  CreateAgentRuleRequestDTO,
  PatchAgentRuleRequestDTO,
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;
export type PatchAgentRequest = PatchAgentRequestDTO;
export type PatchAgentProjectRequest = {
  name?: string;
  description?: string | null;
  context?: string | null;
};

export type ChatAgentRequest = {
  clientRequestId?: string;
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

export type ChatExecutionLifecycleStatus = "QUEUED" | "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type ChatExecutionFailureClass = "OWNERSHIP_VIOLATION" | "CONVERSATION_NOT_FOUND" | "INVALID_LIFECYCLE_STATE" | "IDEMPOTENCY_CONFLICT" | "EXECUTION_ERROR";

export type ChatAgentAcceptedResponse = {
  executionId: string;
  conversationId?: string;
  inputMessageId?: string;
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

export type ChatExecutionState = "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type ChatExecutionFailure = {
  code: string;
  message: string;
  details?: string;
};

export type SubmitChatExecutionResponse = {
  executionId: string;
  state: ChatExecutionState;
  conversationId: string;
  inputMessageId?: string;
  lifecycleStatus: ChatExecutionLifecycleStatus;
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
  type: "DIRECT" | "MULTI_AGENT";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
};

export type AgentConversationsResponse = {
  items: AgentConversation[];
};

export type AgentConversationDetails = {
  id: string;
  title: string;
  type: "DIRECT" | "MULTI_AGENT";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messages: ChatAgentMessage[];
  executions: Array<{
    executionId: string;
    status: ChatExecutionLifecycleStatus;
    acceptedAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    errorCode?: string;
    errorMessage?: string;
    assistantMessage?: ChatAgentMessage;
  }>;
};

export type ProjectConversationParticipant = {
  type: "USER" | "AGENT";
  agentId?: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
};

export type ProjectConversation = {
  id: string;
  projectId: string;
  title: string;
  type: "DIRECT" | "MULTI_AGENT";
  status: "ACTIVE" | "DELETED";
  participants: ProjectConversationParticipant[];
  canSendMessages: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
};

export type ProjectConversationsResponse = {
  items: ProjectConversation[];
};

export type ProjectConversationDetails = ProjectConversation & {
  project?: {
    id: string;
    name: string;
    context?: string | null;
  };
  messages: ChatAgentMessage[];
};

export type ProjectConversationExecutionStatus =
  | "ACCEPTED"
  | "QUEUED"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type SubmitProjectConversationExecutionRequest = {
  message: string;
  clientRequestId?: string;
};

export type SubmitProjectConversationExecutionResponse = {
  conversationId: string;
  inputMessageId?: string;
  runtimeDispatched: boolean;
  execution?: {
    executionId?: string;
    executionStatus?: ProjectConversationExecutionStatus;
  };
};


export type CreateAgentProjectRequest = CreateAgentProjectRequestDTO;
export type AgentProject = AgentProjectDTO;
export type AgentProjectsPage = AgentProjectsPageResponseDTO;
export type AddAgentToProjectRequest = AddAgentToProjectRequestDTO;
export type ProjectAgent = ProjectAgentResponseDTO;
export type ProjectAgentsResponse = ProjectAgentsResponseDTO;
export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";

export type AgentProjectFlow = import("@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models").AgentProjectFlowResponseDTO;
export type AgentProjectFlowPalette = import("@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models").AgentProjectFlowPaletteResponseDTO;
export type AgentProjectFlowNode = import("@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models").AgentProjectFlowNodeDTO;
export type AgentProjectFlowEdge = import("@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models").AgentProjectFlowEdgeDTO;
export type AgentProjectFlowPaletteSource = import("@sitionix/app-afesox-bffssox-frontend-sitionix-140-unstable/models").AgentProjectFlowPaletteSourceDTO;
