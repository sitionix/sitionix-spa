import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BenefitsSection } from "../../components/BenefitsSection";

describe("BenefitsSection", () => {
  it("renders platform benefits", () => {
    render(<BenefitsSection />);

    expect(screen.getByText("Переваги платформи")).toBeInTheDocument();

    [
      "Швидкість",
      "Безпека",
      "Дизайн",
      "Аналітика",
      "Підтримка",
    ].forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
