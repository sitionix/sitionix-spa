import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { registerUserApi } from "../../../../features/registration/api/registerUserApi";
import { server } from "../../../../test/msw/server";

describe("registerUserApi", () => {
  it("Given success response When calling Then returns ok result", async () => {
    // Given
    const request = {
      email: "ok@example.com",
      password: "Password1!",
      role: "SUPER_ADMIN",
    };

    // When
    const result = await registerUserApi(request);

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("PENDING_EMAIL_VERIFY");
    }
  });

  it("Given error response When calling Then returns error result", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/users", () =>
        HttpResponse.json(
          { code: 400, title: "Bad Request", details: "Invalid data" },
          { status: 400 }
        )
      )
    );

    // When
    const result = await registerUserApi({
      email: "fail@example.com",
      password: "Password1!",
      role: "SUPER_ADMIN",
    });

    // Then
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toBe("Invalid data");
    }
  });
});
