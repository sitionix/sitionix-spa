import type {
  AgentDTO,
  CreateAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
