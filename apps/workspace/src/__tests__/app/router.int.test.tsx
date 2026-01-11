import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorkspaceRoutes } from "../../app/router";

describe("WorkspaceRoutes", () => {
  it("renders dashboard on root", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <WorkspaceRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/we're on dashboard/i)).toBeInTheDocument();
  });
});
