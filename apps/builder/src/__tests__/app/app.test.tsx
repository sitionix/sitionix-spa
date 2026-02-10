import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { App } from "../../app/App";

describe("App", () => {
  it("renders builder shell on root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("No pages yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pages" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ New page" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No page selected")
    ).toBeInTheDocument();
  });
});
