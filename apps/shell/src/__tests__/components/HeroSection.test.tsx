import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSection } from "../../components/HeroSection";

describe("HeroSection", () => {
  it("renders hero copy and triggers register navigation", async () => {
    const onNavigate = vi.fn();
    render(<HeroSection onNavigate={onNavigate} />);
    const user = userEvent.setup();

    expect(
      screen.getByText("Ваше коштовне місце в Інтернеті.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Створити" }));
    expect(onNavigate).toHaveBeenCalledWith("register");
  });
});
