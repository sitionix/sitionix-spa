import type {
  AgentDTO,
  ChatAgentRequestDTO,
  ChatAgentResponseDTO,
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-116-unstable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;
export type PatchAgentRequest = PatchAgentRequestDTO;
export type ChatAgentRequest = ChatAgentRequestDTO;
export type ChatAgentResponse = ChatAgentResponseDTO;

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
