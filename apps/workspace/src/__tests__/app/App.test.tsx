import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../app/App";

describe("App", () => {
  it("renders dashboard copy", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/we're on dashboard/i)).toBeInTheDocument();
  });
});
