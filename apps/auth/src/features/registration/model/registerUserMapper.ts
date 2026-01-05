import type { RegisterUserRequest, GlobalUserRole} from "@sitionix/contracts";

import type { RegisterFormValues } from "../validation/registerFormSchema";

export type RegisterContext = {
  siteId?: string;
  role: GlobalUserRole;
};

export function mapFormToRegisterRequest(
  values: RegisterFormValues,
  ctx: RegisterContext
): RegisterUserRequest {
  return {
    email: values.email,
    password: values.password,
    siteId: ctx.siteId,
    role: ctx.role,
  };
}

