import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../app/App";

describe("App", () => {
  it("renders dashboard copy", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/sitionix crm/i)
    ).toBeInTheDocument();
  });
});
