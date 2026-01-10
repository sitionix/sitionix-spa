import type { GlobalUserRole } from "@sitionix/contracts";

export type LoginContext = {
  role: GlobalUserRole;
  siteId?: string | null;
  sessionSourceId: string;
  userAgent: string;
};
