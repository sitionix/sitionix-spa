import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import AuthorisationPage from "../../../../features/authorisation/ui/AuthorisationPage";
import { server } from "../../../../test/msw/server";
import { authSessionManager } from "@sitionix/auth-session";
import { AuthRoutes } from "../../../../app/router";

describe("AuthorisationPage", () => {
  it("Given email input When opening email panel Then prefills form and logs in", async () => {
    // Given
    window.history.pushState({}, "", "/authorisation?siteId=site-777");
    localStorage.setItem("sitionix.sessionSourceId", "ssid-777");
    Object.defineProperty(window.navigator, "userAgent", {
      value: "TestAgent/1.0",
      configurable: true,
    });

    let receivedBody: unknown;
    server.use(
      http.post("http://localhost/api/v1/auth/login", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          accessToken: "access-1",
          expiresIn: 3600,
          tokenType: "Bearer",
        });
      })
    );

    render(
      <MemoryRouter>
        <AuthorisationPage />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // When
    const emailInputs = screen.getAllByPlaceholderText("Електрона пошта");
    await user.type(emailInputs[0], "user@example.com");
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));
    const inputs = screen.getAllByPlaceholderText("Електрона пошта");
    expect(inputs[1]).toHaveValue("user@example.com");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Увійти" }));

    // Then
    const expectedUserAgent = navigator.userAgent;
    await waitFor(() =>
      expect(receivedBody).toMatchObject({
        email: "user@example.com",
        password: "Password1!",
        sessionSourceId: "ssid-777",
        userAgent: expectedUserAgent,
      })
    );
    expect(authSessionManager.getAccessToken()).toBe("access-1");
  });

  it("Given auth error When submitting Then shows error text", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/auth/login", () =>
        HttpResponse.json(
          { code: 401, title: "Unauthorized", details: "Invalid" },
          { status: 401 }
        )
      )
    );

    render(
      <MemoryRouter>
        <AuthorisationPage />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));
    const formEmailInput = screen.getAllByPlaceholderText("Електрона пошта")[1];
    await user.type(formEmailInput, "user@example.com");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Увійти" }));

    // Then
    expect(await screen.findByText("Невірна пошта або пароль")).toBeInTheDocument();
  });

  it("Given successful login When submitting Then closes email panel", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/auth/login", () =>
        HttpResponse.json({
          accessToken: "access-777",
          expiresIn: 3600,
          tokenType: "Bearer",
        })
      )
    );

    render(
      <MemoryRouter>
        <AuthorisationPage />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    const dialog = screen.getByRole("dialog", { hidden: true });

    // When
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));
    await user.type(screen.getAllByPlaceholderText("Електрона пошта")[1], "user@example.com");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Увійти" }));

    // Then
    await waitFor(() => expect(dialog).toHaveAttribute("aria-hidden", "true"));
  });

  it("Given email panel When toggling Then updates dialog aria-hidden", async () => {
    // Given
    render(
      <MemoryRouter>
        <AuthorisationPage />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    const dialog = screen.getByRole("dialog", { hidden: true });

    // When
    expect(dialog).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));

    // Then
    expect(dialog).toHaveAttribute("aria-hidden", "false");

    // When
    await user.click(screen.getByLabelText("Закрити панель"));

    // Then
    expect(dialog).toHaveAttribute("aria-hidden", "true");

    // When
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));
    await user.click(screen.getByLabelText("Закрити"));

    // Then
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("Given social actions When clicked Then logs and navigates to registration", async () => {
    // Given
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={["/authorisation"]}>
        <AuthRoutes />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: /Google/ }));
    await user.click(screen.getByRole("button", { name: /Facebook/ }));
    await user.click(screen.getByRole("button", { name: /Apple/ }));
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    // Then
    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Реєстраці")).toBeInTheDocument();
  });

  it("Given page When rendered Then uses shared background", () => {
    // Given / When
    const { container } = render(
      <MemoryRouter>
        <AuthorisationPage />
      </MemoryRouter>
    );

    // Then
    expect(container.firstElementChild).toHaveClass("bg-brand-50");
  });
});
