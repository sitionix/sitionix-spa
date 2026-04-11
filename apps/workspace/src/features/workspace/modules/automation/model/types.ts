export type AutomationAgent = {
  id: string;
  name: string;
  description: string;
  status: "DRAFT";
  createdAt: string;
  updatedAt: string;
};

export type CreateAgentRequest = {
  name: string;
  description: string;
};

export type AutomationPageStatus = "idle" | "loading" | "ready" | "error";
