import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import type { WorkspaceEditorData, WorkspaceSiteOverview } from "@sitionix/contracts";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { SiteSettingsPage } from "../../../../../features/workspace/ui/pages/SiteSettingsPage";
import { SiteEditorPage } from "../../../../../features/workspace/ui/pages/SiteEditorPage";

const { navigateHostMock } = vi.hoisted(() => ({
  navigateHostMock: vi.fn(),
}));

const { mockOverview, api } = vi.hoisted(() => {
  const mockOverview: WorkspaceSiteOverview = {
    siteId: "site-1",
    name: "Корпоративний сайт",
    description: null,
    type: "standalone",
    status: "published",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-02T12:00:00.000Z",
  };

  const mockEditor: WorkspaceEditorData = {
    palette: [{ id: "text", label: "Текст" }],
    preview: {
      heroTitle: "Ласкаво просимо",
      heroSubtitle: "Subtitle",
      ctaLabel: "CTA",
      blocks: [{ id: "block-1", title: "Block", description: "Desc" }],
      footerText: "Footer",
    },
  };

  const api: WorkspaceApi = {
    getSiteOverview: vi.fn().mockResolvedValue(mockOverview),
    getEditorData: vi.fn().mockResolvedValue(mockEditor),
  } as unknown as WorkspaceApi;

  return { mockOverview, mockEditor, api };
});

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

vi.mock("../../../../../shared/navigation/navigateHost", () => ({
  navigateHost: navigateHostMock,
}));

describe("SiteSettingsPage", () => {
  it("navigates back through host router", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/sites/site-1/settings"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites/:siteId/settings" element={<SiteSettingsPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    await screen.findByText("Що далі");
    await user.click(screen.getAllByRole("button", { name: "Назад до сайтів" })[0]);

    expect(navigateHostMock).toHaveBeenCalledWith("/workspace/sites");
  });

  it("loads overview data", async () => {
    render(
      <MemoryRouter initialEntries={["/sites/site-1/settings"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites/:siteId/settings" element={<SiteSettingsPage />} />
            <Route path="/sites" element={<div>Sites Route</div>} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Що далі")).toBeInTheDocument();
    expect(screen.getAllByText("Корпоративний сайт").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Опублікований").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Standalone").length).toBeGreaterThan(0);
    expect(screen.getByText("Site ID: site-1")).toBeInTheDocument();
    expect(screen.getByText("Швидкі дії")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сторінки" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Домени" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Публікація" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Аналітика" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Налаштування" })).toBeDisabled();
  });
});

describe("SiteEditorPage", () => {
  it("renders editor and toggles view", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/editor/site-1"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/editor/:siteId" element={<SiteEditorPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    const matching = await screen.findAllByText(mockOverview.name, {}, { timeout: 3000 });
    expect(matching.length).toBeGreaterThan(0);
    let canvas = container.querySelector(".shadow-2xl");
    expect(canvas?.className).toContain("w-full");

    const tabletButton = container.querySelector("svg.lucide-tablet")?.closest("button");
    if (!tabletButton) {
      throw new Error("Tablet button not found");
    }

    await user.click(tabletButton);
    canvas = container.querySelector(".shadow-2xl");
    expect(canvas?.className).toContain("w-[768px]");
  });
});
