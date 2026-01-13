import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../../components/Footer";

describe("Footer", () => {
  it("renders contact and legal info", () => {
    render(<Footer />);

    expect(screen.getByText("Контакти")).toBeInTheDocument();
    expect(screen.getByText("info@sitionix.com")).toBeInTheDocument();
    expect(screen.getByText("Політика конфіденційності")).toBeInTheDocument();
    expect(screen.getByText("© 2025 Sitionix. Всі права захищені.")).toBeInTheDocument();
  });
});
