import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { IntegrationsSection } from "../../components/IntegrationsSection";

describe("IntegrationsSection", () => {
  it("shows integration list on hover", () => {
    render(<IntegrationsSection />);

    expect(screen.getByText("Інтеграції")).toBeInTheDocument();

    const title = screen.getByText("Реклама");
    const wrapper = title.parentElement?.parentElement?.parentElement;
    expect(wrapper).toBeTruthy();

    fireEvent.mouseEnter(wrapper as Element);

    expect(screen.getByText("Google Ads")).toBeInTheDocument();
  });
});
