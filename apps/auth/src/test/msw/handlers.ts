import { http, HttpResponse } from "msw";
import type { RegisterUserRequest, RegisterUserResponse } from "@sitionix/contracts";
import type { LoginUserRequest, LoginUserResponse } from "../../features/authorisation/model/loginUserTypes";

export const handlers = [
  http.get("http://localhost/api/v1/session", () =>
    HttpResponse.json({ authenticated: false }, { status: 401 })
  ),
  http.post("http://localhost/api/v1/users", async ({ request }) => {
    const body = (await request.json()) as RegisterUserRequest;

    const response: RegisterUserResponse = {
      message: `User ${body.email} registered`,
      userId: 123,
      status: "PENDING_EMAIL_VERIFY",
    };

    return HttpResponse.json(response);
  }),
  http.post("http://localhost/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginUserRequest;

    const response: LoginUserResponse = {
      authenticated: true,
      user: {
        id: "1",
        email: body.email,
        role: "SUPER_ADMIN",
      },
      idleTimeoutSeconds: 86400,
    };

    return HttpResponse.json(response);
  }),
];
