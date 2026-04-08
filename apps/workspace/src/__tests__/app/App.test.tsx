import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { WorkspaceApi } from "../../features/workspace/api/workspaceApi";
import { App } from "../../app/App";

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

vi.mock("../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

describe("App", () => {
  it("renders dashboard copy", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: "Вітаємо в Sitionix CRM" })
    ).toBeInTheDocument();
  });
});
