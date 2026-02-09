import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import type { WorkspaceEditorData, WorkspaceSite } from "@sitionix/contracts";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { SiteSettingsPage } from "../../../../../features/workspace/ui/pages/SiteSettingsPage";
import { SiteEditorPage } from "../../../../../features/workspace/ui/pages/SiteEditorPage";

const { mockSite, api } = vi.hoisted(() => {
  const mockSite: WorkspaceSite = {
    id: "site-1",
    name: "Корпоративний сайт",
    domain: "corporate.sitionix.com",
    description: null,
    seoTitle: null,
    seoDescription: null,
    type: "standalone",
    status: "published",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-02T12:00:00.000Z",
    visits: 0,
    ecosystemName: null,
    collectionId: null,
    thumbnailUrl: null,
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
    getSite: vi.fn().mockResolvedValue(mockSite),
    updateSite: vi.fn().mockResolvedValue(mockSite),
    getEditorData: vi.fn().mockResolvedValue(mockEditor),
  } as unknown as WorkspaceApi;

  return { mockSite, mockEditor, api };
});

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

describe("SiteSettingsPage", () => {
  it("loads site data and saves", async () => {
    const user = userEvent.setup();

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

    expect(await screen.findByText("Налаштування сайту")).toBeInTheDocument();

    const nameInput = screen.getByLabelText("Назва сайту");
    await user.clear(nameInput);
    await user.type(nameInput, "Оновлений сайт");

    await user.click(screen.getByRole("button", { name: /Зберегти зміни/ }));
    expect(await screen.findByText("Sites Route")).toBeInTheDocument();
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

    const matching = await screen.findAllByText(mockSite.name, {}, { timeout: 3000 });
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
