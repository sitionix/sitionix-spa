import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost/api/v1/session", () => {
    return HttpResponse.json({
      authenticated: true,
      user: {
        id: "1",
        email: "user@example.com",
        role: "SUPER_ADMIN",
      },
      idleTimeoutSeconds: 86400,
    });
  }),
  http.get("http://localhost/api/v1/workspace", () => {
    return HttpResponse.json({ ok: true });
  }),
];
