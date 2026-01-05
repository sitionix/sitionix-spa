export const GLOBAL_USER_ROLES = [
    "SITE_USER", 
    "SITE_ADMIN", 
    "SUPER_ADMIN"
] as const;

export type GlobalUserRole = (typeof GLOBAL_USER_ROLES)[number];

