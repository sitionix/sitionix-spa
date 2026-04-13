import type {
  AgentDTO,
  CreateAgentRequestDTO,
} from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";

export type AutomationAgent = AgentDTO;
export type CreateAgentRequest = CreateAgentRequestDTO;

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
