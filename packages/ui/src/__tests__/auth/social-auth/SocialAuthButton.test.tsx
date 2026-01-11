import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialAuthButton } from "../../../auth/social-auth/SocialAuthButton";

describe("SocialAuthButton", () => {
  it("Given onClick When clicked Then triggers handler", async () => {
    // Given
    const onClick = vi.fn();
    render(
      <SocialAuthButton
        label="Google"
        placeholderIcon="G"
        onClick={onClick}
      />
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: /Google/ }));

    // Then
    expect(onClick).toHaveBeenCalled();
  });
});
