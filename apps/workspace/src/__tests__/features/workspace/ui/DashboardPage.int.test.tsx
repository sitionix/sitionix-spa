import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../features/workspace/api/workspaceApi";
import { DashboardPage } from "../../../../features/workspace/ui/pages/DashboardPage";
import { WorkspaceApiProvider } from "../../../../features/workspace/api/WorkspaceApiProvider";

const { api } = vi.hoisted(() => {
  const api: WorkspaceApi = {
    getDashboardSummary: vi.fn().mockResolvedValue({
      totalSites: 2,
      publishedSites: 1,
      totalVisits: 1200,
      activeUsers: 230,
      recentSites: [
        {
          id: "site-1",
          name: "Sitionix CRM",
          domain: "crm.sitionix.com",
          visits: 1200,
          updatedAt: "2026-04-08T10:00:00.000Z",
        },
      ],
    }),
  } as unknown as WorkspaceApi;

  return { api };
});

vi.mock("../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

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
