import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { loginUserApi } from "../../../../features/authorisation/api/loginUserApi";
import { server } from "../../../../test/msw/server";

describe("loginUserApi", () => {
  it("Given success response When calling Then returns ok result", async () => {
    // Given
    const request = {
      email: "ok@example.com",
      password: "Password1!",
      sessionSourceId: "ssid",
      userAgent: "Agent",
    };

    // When
    const result = await loginUserApi(request);

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.accessToken).toContain("ok@example.com");
    }
  });

  it("Given 401 response When calling Then returns normalized auth error", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/auth/login", () =>
        HttpResponse.json(
          { code: 401, title: "Unauthorized", details: "Invalid" },
          { status: 401 }
        )
      )
    );

    // When
    const result = await loginUserApi({
      email: "fail@example.com",
      password: "Password1!",
      sessionSourceId: "ssid",
      userAgent: "Agent",
    });

    // Then
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toBe("Невірна пошта або пароль");
    }
  });

  it("Given non-auth error response When calling Then returns backend error", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/auth/login", () =>
        HttpResponse.json(
          { code: 500, title: "Server", details: "Oops" },
          { status: 500 }
        )
      )
    );

    // When
    const result = await loginUserApi({
      email: "fail@example.com",
      password: "Password1!",
      sessionSourceId: "ssid",
      userAgent: "Agent",
    });

    // Then
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toBe("Oops");
    }
  });
});
