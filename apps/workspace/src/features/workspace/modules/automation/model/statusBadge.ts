import type { AgentProject, AutomationAgent } from "./types";

type AutomationStatus = AutomationAgent["status"] | AgentProject["status"];

const STATUS_BADGE_CLASS: Record<AutomationStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
  DELETED: "bg-amber-50 text-amber-700",
  DRAFT: "bg-amber-50 text-amber-700",
};

export function getStatusBadgeClass(status: AutomationStatus): string {
  return STATUS_BADGE_CLASS[status] ?? "bg-amber-50 text-amber-700";
}
