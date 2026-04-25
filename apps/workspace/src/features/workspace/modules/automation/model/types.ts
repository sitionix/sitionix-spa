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

export type ChatAgentResponse = {
  conversationId: string;
  reply: ChatAgentMessage;
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
