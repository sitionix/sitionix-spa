import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthButton } from "../../auth/AuthButton";

describe("AuthButton", () => {
  it("Given label When rendered Then shows label and handles click", async () => {
    // Given
    const onClick = vi.fn();
    render(<AuthButton label="Click me" onClick={onClick} />);
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: "Click me" }));

    // Then
    expect(onClick).toHaveBeenCalled();
  });

  it("Given loading When rendered Then shows loading label and disables button", () => {
    // Given
    render(<AuthButton label="Submit" isLoading />);

    // When
    const button = screen.getByRole("button", { name: "Відправляємо..." });

    // Then
    expect(button).toBeDisabled();
  });
});
