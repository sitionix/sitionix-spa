import type {
  AgentDTO,
  CreateAgentRequestDTO,
  PatchAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;
export type PatchAgentRequest = PatchAgentRequestDTO;
export type ChatAgentRequest = {
  message: string;
};
export type ChatAgentResponse = {
  reply: string;
};

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
