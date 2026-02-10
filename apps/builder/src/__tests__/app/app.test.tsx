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

    expect(screen.getByText("Empty page")).toBeInTheDocument();
    expect(
      screen.getByText("Component library will appear here.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select an element to inspect its properties.")
    ).toBeInTheDocument();
  });
});
