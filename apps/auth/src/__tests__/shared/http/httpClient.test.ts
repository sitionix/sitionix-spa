import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { requestJson } from "../../../shared/http/httpClient";
import { server } from "../../../test/msw/server";

describe("requestJson", () => {
  it("Given JSON success response When calling Then returns ok data", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/test", () =>
        HttpResponse.json({ ok: true })
      )
    );

    // When
    const result = await requestJson<{ ok: boolean }, { message: string }, { foo: string }>({
      method: "POST",
      path: "/api/v1/test",
      body: { foo: "bar" },
    });

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ ok: true });
    }
  });

  it("Given non-JSON error response When calling Then returns error with null payload", async () => {
    // Given
    server.use(
      http.get("http://localhost/api/v1/test-error", () =>
        new HttpResponse("Boom", { status: 500 })
      )
    );

    // When
    const result = await requestJson<{ ok: boolean }, { message: string }, undefined>({
      method: "GET",
      path: "/api/v1/test-error",
    });

    // Then
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(500);
      expect(result.error).toBeNull();
    }
  });
});
