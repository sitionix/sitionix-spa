import type { RegisterUserDTO } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";

import type { RegisterFormValues } from "../validation/registerFormSchema";
import type { RegisterContext } from "./RegisterContext";

export function mapFormToRegisterRequest(
  values: RegisterFormValues,
  ctx: RegisterContext
): RegisterUserDTO {
  return {
    email: values.email,
    password: values.password,
    siteId: ctx.siteId,
    role: ctx.role,
  };
}
