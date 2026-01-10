import type { GlobalUserRole } from "@sitionix/contracts"

export type RegisterContext = {
    role: GlobalUserRole;
    siteId?: string | null
}
