import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorkspaceRoutes } from "../../app/router";
import { WorkspaceApiProvider } from "../../features/workspace/api/WorkspaceApiProvider";

describe("WorkspaceRoutes", () => {
  it("renders dashboard on root", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <WorkspaceApiProvider>
          <WorkspaceRoutes />
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/sitionix crm/i)
    ).toBeInTheDocument();
  });
});
