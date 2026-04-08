import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { DashboardPage } from "../../../../../features/workspace/ui/pages/DashboardPage";
import { CRMPage } from "../../../../../features/workspace/ui/pages/CRMPage";

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
    getCrmSummary: vi.fn().mockResolvedValue({
      overview: {
        totalViews: 1200,
        totalViewsChangePct: 12,
        averageViewsPerSite: 600,
        averageViewsChangePct: 8,
        uniqueVisitors: 840,
        uniqueVisitorsChangePct: 5,
        averageSessionDurationSeconds: 165,
      },
      sitePerformance: [
        {
          siteId: "site-1",
          siteName: "Sitionix CRM",
          domain: "crm.sitionix.com",
          views: 1200,
          uniqueVisitors: 840,
          bounceRatePct: 34,
          status: "published",
        },
      ],
      trafficSources: [
        { source: "Органічний пошук", visits: 4234, percentage: 45 },
      ],
      topPages: [
        { path: "/", views: 3456 },
      ],
    }),
  } as unknown as WorkspaceApi;

  return { api };
});

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

describe("DashboardPage", () => {
  it("renders dashboard data and navigates", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sites" element={<div>Sites Route</div>} />
            <Route path="/crm" element={<div>CRM Route</div>} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Вітаємо в Sitionix CRM")).toBeInTheDocument();
    expect(screen.getByText("Останні сайти")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /мої сайти/i }));
    expect(await screen.findByText("Sites Route")).toBeInTheDocument();
  });
});

describe("CRMPage", () => {
  it("renders CRM analytics", async () => {
    render(
      <MemoryRouter initialEntries={["/crm"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/crm" element={<CRMPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("CRM Аналітика")).toBeInTheDocument();
    expect(screen.getByText("2:45")).toBeInTheDocument();
    expect(screen.getByText("Продуктивність сайтів")).toBeInTheDocument();
  });
});
