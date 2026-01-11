import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import EmailRegisterForm from "../../../../features/registration/ui/EmailRegisterForm";
import { server } from "../../../../test/msw/server";

describe("EmailRegisterForm", () => {
  it("Given valid input When submitting Then sends request and calls onSuccess", async () => {
    // Given
    const onSuccess = vi.fn();
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

    render(<EmailRegisterForm onSuccess={onSuccess} role="SUPER_ADMIN" />);
    const user = userEvent.setup();

    // When
    await user.type(screen.getByPlaceholderText("Електрона пошта"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Ім’я"), "User");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.type(screen.getByPlaceholderText("Повторіть пароль"), "Password1!");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    // Then
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(receivedBody).toEqual({
      email: "user@example.com",
      password: "Password1!",
      role: "SUPER_ADMIN",
    });
  });

  it("Given pending request When submitting Then shows loading state", async () => {
    // Given
    const onSuccess = vi.fn();
    let resolveRequest: (value: HttpResponse) => void = () => undefined;
    server.use(
      http.post("http://localhost/api/v1/users", () => {
        return new Promise((resolve) => {
          resolveRequest = resolve;
        });
      })
    );

    render(<EmailRegisterForm onSuccess={onSuccess} role="SUPER_ADMIN" />);
    const user = userEvent.setup();

    // When
    await user.type(screen.getByPlaceholderText("Електрона пошта"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Ім’я"), "User");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.type(screen.getByPlaceholderText("Повторіть пароль"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    // Then
    expect(screen.getByRole("button", { name: "Відправляємо..." })).toBeDisabled();

    // Cleanup
    resolveRequest(
      HttpResponse.json({
        message: "ok",
        userId: 1,
        status: "PENDING_EMAIL_VERIFY",
      })
    );
  });

  it("Given error response When submitting Then shows error text", async () => {
    // Given
    server.use(
      http.post("http://localhost/api/v1/users", () =>
        HttpResponse.json(
          { code: 400, title: "Bad Request", details: "Invalid data" },
          { status: 400 }
        )
      )
    );
    render(<EmailRegisterForm onSuccess={vi.fn()} role="SUPER_ADMIN" />);
    const user = userEvent.setup();

    // When
    await user.type(screen.getByPlaceholderText("Електрона пошта"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Ім’я"), "User");
    await user.type(screen.getByPlaceholderText("Пароль"), "Password1!");
    await user.type(screen.getByPlaceholderText("Повторіть пароль"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    // Then
    expect(await screen.findByText("Invalid data")).toBeInTheDocument();
  });
});
