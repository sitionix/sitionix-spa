import { http, HttpResponse } from "msw";
import type {
  RegisterUserDTO,
  ResponseRegisterUserDTO,
} from "@sitionix/app-afesox-bffssox-frontend-stable/models";
import type { LoginUserRequest, LoginUserResponse } from "../../features/authorisation/model/loginUserTypes";

export const handlers = [
  http.post("http://localhost/api/v1/users", async ({ request }) => {
    const body = (await request.json()) as RegisterUserDTO;

    const response: ResponseRegisterUserDTO = {
      message: `User ${body.email} registered`,
      userId: 123,
      status: "PENDING_EMAIL_VERIFY",
    };

    return HttpResponse.json(response);
  }),
  http.post("http://localhost/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginUserRequest;

    const response: LoginUserResponse = {
      accessToken: `access-${body.email}`,
      expiresIn: 3600,
      tokenType: "Bearer",
    };

    return HttpResponse.json(response);
  }),
  http.post("http://localhost/api/v1/auth/refresh", () =>
    HttpResponse.json(
      { code: 401, title: "Unauthorized", details: "No refresh cookie" },
      { status: 401 }
    )
  ),
];
