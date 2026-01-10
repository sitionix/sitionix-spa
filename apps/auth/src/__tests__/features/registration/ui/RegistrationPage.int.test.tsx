import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import RegistrationPage from "../../../../features/registration/ui/RegistrationPage";
import { server } from "../../../../test/msw/server";
import { AuthRoutes } from "../../../../app/router";

describe("RegistrationPage", () => {
  it("Given siteId in URL When registering Then sends siteId in request", async () => {
    // Given
    window.history.pushState({}, "", "/?siteId=site-123");
    let receivedBody: unknown;
    server.use(
      http.post("http://localhost/api/v1/users", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          message: "ok",
          userId: 1,
          status: "PENDING_EMAIL_VERIFY",
        });
      })
    );

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: "Увійти через пошту" }));
    await user.type(screen.getByPlaceholderText("Електрона пошта"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Ім’я"), "User");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.type(screen.getByPlaceholderText("Повторіть пароль"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    // Then
    await waitFor(() =>
      expect(receivedBody).toEqual({
        email: "user@example.com",
        password: "Password1!",
        role: "SUPER_ADMIN",
      })
    );
    expect(
      await screen.findByText(
        "Перевір пошту — ми надіслали лист для підтвердження."
      )
    ).toBeInTheDocument();
  });

  it("Given email panel When toggling Then updates dialog aria-hidden", async () => {
    // Given
    render(
      <MemoryRouter>
        <RegistrationPage />
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
  });

  it("Given social actions When clicked Then logs and navigates to authorisation", async () => {
    // Given
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthRoutes />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: /Google/ }));
    await user.click(screen.getByRole("button", { name: /Facebook/ }));
    await user.click(screen.getByRole("button", { name: /Apple/ }));
    await user.click(screen.getByRole("button", { name: "Увійти" }));

    // Then
    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Авторизація")).toBeInTheDocument();
  });
});
