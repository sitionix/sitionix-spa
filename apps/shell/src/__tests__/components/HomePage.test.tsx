import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "../../components/HomePage";

describe("HomePage", () => {
  it("renders sections and shell layout", () => {
    render(<HomePage onNavigate={vi.fn()} />);

    expect(screen.getByText("Ваше коштовне місце в Інтернеті.")).toBeInTheDocument();
    expect(screen.getByText("Переваги платформи")).toBeInTheDocument();
    expect(screen.getByText("Інтеграції")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Часті запитання" })).toBeInTheDocument();
  });
});
