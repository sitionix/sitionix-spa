import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost/api/v1/workspace", () => {
    return HttpResponse.json({ ok: true });
  }),
];
