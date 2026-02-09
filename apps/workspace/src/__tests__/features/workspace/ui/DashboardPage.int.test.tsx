import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../../../../features/workspace/ui/pages/DashboardPage";
import { WorkspaceApiProvider } from "../../../../features/workspace/api/WorkspaceApiProvider";

describe("DashboardPage", () => {
  it("Given render When loaded Then shows CRM heading", async () => {
    // Given / When
    render(
      <MemoryRouter>
        <WorkspaceApiProvider>
          <DashboardPage />
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    // Then
    expect(
      await screen.findByText("Вітаємо в Sitionix CRM")
    ).toBeInTheDocument();
  });
});
