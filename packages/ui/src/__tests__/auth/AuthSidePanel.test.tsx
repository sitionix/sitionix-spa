import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthSidePanel } from "../../auth/AuthSidePanel";

describe("AuthSidePanel", () => {
  it("Given props When clicking CTAs Then triggers handlers", async () => {
    // Given
    const onPrimary = vi.fn();
    const onAccount = vi.fn();
    render(
      <AuthSidePanel
        title="Title"
        subtitle="Subtitle"
        primaryCtaLabel="Primary"
        primaryCtaClick={onPrimary}
        socialAction={{
          onGoogle: vi.fn(),
          onFacebook: vi.fn(),
          onApple: vi.fn(),
        }}
        legalSlot={<div>Legal</div>}
        accoutLabel="Have account?"
        accountCtaLabel="Login"
        accountCtaClick={onAccount}
        topInputSlot={<input aria-label="TopInput" />}
      />
    );
    const user = userEvent.setup();

    // When
    await user.click(screen.getByRole("button", { name: "Primary" }));
    await user.click(screen.getByRole("button", { name: "Login" }));

    // Then
    expect(onPrimary).toHaveBeenCalled();
    expect(onAccount).toHaveBeenCalled();
    expect(screen.getByLabelText("TopInput")).toBeInTheDocument();
  });
});
