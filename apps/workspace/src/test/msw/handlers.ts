import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost/api/v1/workspace", () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("http://localhost/api/v1/auth/refresh", () => {
    return HttpResponse.json(
      { code: 401, title: "Unauthorized", details: "No refresh cookie" },
      { status: 401 }
    );
  }),
];
