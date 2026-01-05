export const USER_STATUS = [
    "PENDING_EMAIL_VERIFY",
    "ACTIVE",
    "INACTIVE",
    "BANNED"
] as const

export type UserStatus = (typeof USER_STATUS)[number]