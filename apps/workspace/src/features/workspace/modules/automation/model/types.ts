import type {
  AgentDTO,
  AgentRuleDTO,
  AgentRulesResponseDTO,
  CreateAgentRequestDTO,
  CreateAgentRuleRequestDTO,
  DeleteAgentRuleResponseDTO,
  PatchAgentRuleRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-118-unstable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;
export type PatchAgentRequest = PatchAgentRequestDTO;
export type AgentRule = AgentRuleDTO;
export type AgentRulesResponse = AgentRulesResponseDTO;
export type CreateAgentRuleRequest = CreateAgentRuleRequestDTO;
export type PatchAgentRuleRequest = PatchAgentRuleRequestDTO;
export type DeleteAgentRuleResponse = DeleteAgentRuleResponseDTO;

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
