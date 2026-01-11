import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthInput } from "../../../auth/social-auth/AuthInput";

describe("AuthInput", () => {
  it("Given value When typing Then calls onChange", async () => {
    // Given
    const onChange = vi.fn();
    render(
      <AuthInput
        label="Email"
        type="email"
        value="initial"
        onChange={onChange}
        autoComplete="email"
      />
    );
    const user = userEvent.setup();

    // When
    await user.type(screen.getByPlaceholderText("Email"), "x");

    // Then
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Email")).toHaveValue("initial");
  });
});
