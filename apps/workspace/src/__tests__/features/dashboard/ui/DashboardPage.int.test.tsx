import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../../../../features/dashboard/ui/DashboardPage";

describe("DashboardPage", () => {
  it("Given render When loaded Then shows heading and uses shared background", () => {
    // Given / When
    const { container } = render(<DashboardPage />);

    // Then
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("bg-brand-50");
  });
});
