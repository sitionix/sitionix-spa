import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAQSection } from "../../components/FAQSection";

describe("FAQSection", () => {
  it("toggles answers", async () => {
    render(<FAQSection />);
    const user = userEvent.setup();

    expect(screen.getByText("Часті запитання")).toBeInTheDocument();

    const question = screen.getByText("Як створити магазин?");
    await user.click(question);

    expect(
      screen.getByText(/Створення магазину займає всього кілька хвилин/)
    ).toBeInTheDocument();
  });
});
