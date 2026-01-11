import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailRegistrationPanel from "../../../../features/registration/ui/EmailRegisterPanel";

describe("EmailRegisterPanel", () => {
  it("Given isSuccess true When rendered Then shows success message", () => {
    // Given
    render(
      <EmailRegistrationPanel
        isSuccess
        ctx={{ role: "SUPER_ADMIN" }}
        handlers={{ onClose: vi.fn(), onSuccess: vi.fn() }}
      />
    );

    // When
    const message = screen.getByText("Перевір пошту — ми надіслали лист для підтвердження.");

    // Then
    expect(message).toBeInTheDocument();
  });

  it("Given isSuccess false When clicking close Then calls onClose", async () => {
    // Given
    const onClose = vi.fn();
    render(
      <EmailRegistrationPanel
        isSuccess={false}
        ctx={{ role: "SUPER_ADMIN" }}
        handlers={{ onClose, onSuccess: vi.fn() }}
      />
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByLabelText("Закрити"));

    // Then
    expect(onClose).toHaveBeenCalled();
  });
});
