import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { EcosystemSection } from "../../components/EcosystemSection";

describe("EcosystemSection", () => {
  it("renders copy and transitions animation state", () => {
    vi.useFakeTimers();
    render(<EcosystemSection />);

    expect(
      screen.getByText("Створіть власну екосистему")
    ).toBeInTheDocument();
    expect(screen.queryByText("Магазин 1")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(screen.getByText("Магазин 1")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
