import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplatesSection } from "../../components/TemplatesSection";

describe("TemplatesSection", () => {
  it("cycles templates with navigation buttons", async () => {
    render(<TemplatesSection />);
    const user = userEvent.setup();

    expect(screen.getByText("Шаблони для магазинів")).toBeInTheDocument();
    expect(screen.getByText("Одяг")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const nextButton = buttons[1];
    await user.click(nextButton);

    await waitFor(() =>
      expect(screen.getByText("Їжа та напої")).toBeInTheDocument()
    );
  });
});
