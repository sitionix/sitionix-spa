import type { GlobalUserRole } from "./loginUserTypes";

export type LoginContext = {
  role: GlobalUserRole;
  siteId?: string | null;
  sessionSourceId: string;
  userAgent: string;
};
