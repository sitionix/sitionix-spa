import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialAuthPanel } from "../../../auth/social-auth/SocialAuthPanel";

describe("SocialAuthPanel", () => {
  it("Given default props When rendered Then shows default divider and actions work", async () => {
    // Given
    const actions = {
      onGoogle: vi.fn(),
      onFacebook: vi.fn(),
      onApple: vi.fn(),
    };
    render(<SocialAuthPanel actions={actions} />);
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: /Google/ }));
    await user.click(screen.getByRole("button", { name: /Facebook/ }));
    await user.click(screen.getByRole("button", { name: /Apple/ }));

    // Then
    expect(screen.getByText("або")).toBeInTheDocument();
    expect(actions.onGoogle).toHaveBeenCalled();
    expect(actions.onFacebook).toHaveBeenCalled();
    expect(actions.onApple).toHaveBeenCalled();
  });

  it("Given custom dividerLabel When rendered Then shows custom label", () => {
    // Given
    render(
      <SocialAuthPanel
        actions={{ onGoogle: vi.fn(), onFacebook: vi.fn(), onApple: vi.fn() }}
        dividerLabel="or"
      />
    );

    // When
    const divider = screen.getByText("or");

    // Then
    expect(divider).toBeInTheDocument();
  });
});
