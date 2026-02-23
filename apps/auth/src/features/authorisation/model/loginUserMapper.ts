import type { LoginFormValues, LoginUserRequest } from "./loginUserTypes";
import type { LoginContext } from "./LoginContext";

export function mapFormToLoginRequest(
  values: LoginFormValues,
  ctx: LoginContext
): LoginUserRequest {
  return {
    email: values.email,
    password: values.password,
    ...(ctx.siteId ? { siteId: ctx.siteId } : {}),
  };
}
