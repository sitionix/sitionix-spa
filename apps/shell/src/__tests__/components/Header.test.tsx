import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../../components/Header";

describe("Header", () => {
  it("renders and navigates between pages", async () => {
    const onNavigate = vi.fn();
    render(<Header onNavigate={onNavigate} />);
    const user = userEvent.setup();

    expect(screen.getByText("Sitionix")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Увійти" }));
    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));
    await user.click(screen.getByRole("button", { name: "Sitionix" }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "login");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "register");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "home");
  });

  it("updates language selection", async () => {
    render(<Header onNavigate={() => undefined} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Українська/ }));
    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("button", { name: /English/ })).toBeInTheDocument();
  });
});
