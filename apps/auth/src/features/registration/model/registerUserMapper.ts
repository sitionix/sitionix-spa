import type { RegisterUserRequest} from "@sitionix/contracts";

import type { RegisterFormValues } from "../validation/registerFormSchema";
import type { RegisterContext } from "./RegisterContext";

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

