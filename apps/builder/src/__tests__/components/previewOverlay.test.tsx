import { describe, expect, it } from "vitest";
import { renderWithProvider } from "../../test/render";
import { BuilderShell } from "../../ui/components/BuilderShell";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Fullscreen preview", () => {
  it("opens preview overlay and closes via X", async () => {
    const user = userEvent.setup();
    renderWithProvider(<BuilderShell siteId="local" />);

    await user.click(screen.getByRole("button", { name: /preview/i }));
    expect(screen.getByLabelText("Close preview")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close preview"));
    expect(screen.queryByLabelText("Close preview")).toBeNull();
  });

  it("closes preview via Escape", async () => {
    const user = userEvent.setup();
    renderWithProvider(<BuilderShell siteId="local" />);

    await user.click(screen.getByRole("button", { name: /preview/i }));
    expect(screen.getByLabelText("Close preview")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByLabelText("Close preview")).toBeNull();
  });
});
