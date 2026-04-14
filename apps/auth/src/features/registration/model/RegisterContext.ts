import type { RegisterUserDTORoleEnum } from "@sitionix/app-afesox-bffssox-frontend-stable/models";

export type RegisterContext = {
    role: RegisterUserDTORoleEnum;
    siteId?: string | null
}
