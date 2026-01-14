import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomePage } from "../../app/HomePage";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock("../../components/HomePage", () => ({
  HomePage: ({
    onNavigate,
  }: {
    onNavigate: (page: "home" | "register" | "login") => void;
  }) => (
    <div>
      <button type="button" onClick={() => onNavigate("home")}>
        home
      </button>
      <button type="button" onClick={() => onNavigate("register")}>
        register
      </button>
      <button type="button" onClick={() => onNavigate("login")}>
        login
      </button>
    </div>
  ),
}));

describe("HomePage (app)", () => {
  beforeEach(() => {
    navigateSpy.mockClear();
  });

  it("maps page ids to routes", async () => {
    render(<HomePage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "home" }));
    await user.click(screen.getByRole("button", { name: "register" }));
    await user.click(screen.getByRole("button", { name: "login" }));

    expect(navigateSpy).toHaveBeenNthCalledWith(1, "/");
    expect(navigateSpy).toHaveBeenNthCalledWith(2, "/auth/registration");
    expect(navigateSpy).toHaveBeenNthCalledWith(3, "/auth/authorisation");
  });
});
