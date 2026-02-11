import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import type { WorkspaceCollection, WorkspaceSite } from "@sitionix/contracts";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { SitesPage } from "../../../../../features/workspace/ui/pages/SitesPage";

const getFirstMenuButton = (container: HTMLElement) => {
  const icon = container.querySelector("svg.lucide-ellipsis-vertical");
  const button = icon?.closest("button") as HTMLButtonElement | null;
  if (!button) {
    throw new Error("Menu button not found");
  }
  return button;
};

const { api, resetSites, createSiteMock } = vi.hoisted(() => {
  const initialSites: WorkspaceSite[] = [
    {
      id: "site-1",
      name: "Портфоліо агенції",
      domain: "agency.sitionix.design",
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
    },
    {
      id: "site-2",
      name: "Корпоративний сайт",
      domain: "corporate.sitionix.com",
      description: null,
      seoTitle: null,
      seoDescription: null,
      type: "ecosystem",
      status: "draft",
      createdAt: "2026-02-03T12:00:00.000Z",
      updatedAt: "2026-02-04T12:00:00.000Z",
      visits: 0,
      ecosystemName: "MyBusiness",
      collectionId: "col-1",
      thumbnailUrl: null,
    },
  ];

  const createSiteMock = vi.fn();
  const cloneSites = () => initialSites.map((site) => ({ ...site }));
  let sites = cloneSites();

  const resetSites = () => {
    sites = cloneSites();
  };

  const collections: WorkspaceCollection[] = [
    { id: "col-1", name: "Клієнтські проекти", color: "blue", sitesCount: 1 },
  ];

  const api: WorkspaceApi = {
    getSites: vi.fn().mockImplementation(() =>
      Promise.resolve({
        items: sites,
        meta: {
          page: 1,
          size: sites.length,
          totalItems: sites.length,
          totalPages: 1,
        },
      })
    ),
    getCollections: vi.fn().mockResolvedValue({
      items: collections,
      meta: {
        page: 1,
        size: collections.length,
        totalItems: collections.length,
        totalPages: 1,
      },
    }),
    updateSite: vi.fn().mockImplementation((siteId, payload) => {
      sites = sites.map((item) =>
        item.id === siteId ? { ...item, ...payload } : item
      );
      const updated = sites.find((item) => item.id === siteId);
      if (!updated) {
        throw new Error("Site not found");
      }
      return Promise.resolve(updated);
    }),
    duplicateSite: vi.fn().mockImplementation((siteId) => {
      const source = sites.find((item) => item.id === siteId);
      if (!source) {
        throw new Error("Site not found");
      }
      const duplicate = { ...source, id: `dup-${siteId}`, name: `Копія ${source.name}` };
      sites = [duplicate, ...sites];
      return Promise.resolve(duplicate);
    }),
    deleteSite: vi.fn().mockImplementation((siteId) => {
      sites = sites.filter((item) => item.id !== siteId);
      return Promise.resolve();
    }),
    addToCollection: vi.fn().mockResolvedValue(undefined),
    removeFromCollection: vi.fn().mockResolvedValue(undefined),
  } as unknown as WorkspaceApi;

  return { api, resetSites, createSiteMock };
});

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

vi.mock("../../../../../features/workspace/api/sitesApi", () => ({
  createSite: createSiteMock,
  sitesApi: {
    createSite: createSiteMock,
  },
}));

describe("SitesPage", () => {
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetSites();
    createSiteMock.mockReset();
    createSiteMock.mockResolvedValue({ id: "site-new" });
    windowOpenSpy = vi.spyOn(window, "open").mockReturnValue(null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it("renders sites and supports rename/delete/collection actions", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/sites/:siteId/settings" element={<div>Settings Route</div>} />
            <Route path="/editor/:siteId" element={<div>Editor Route</div>} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Мої сайти/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector("svg.lucide-ellipsis-vertical")).toBeTruthy();
    });

    await user.click(getFirstMenuButton(container));
    await user.click(screen.getByText("Перейменувати"));

    const inputs = screen.getAllByRole("textbox");
    const renameInput = inputs[inputs.length - 1];
    await user.clear(renameInput);
    await user.type(renameInput, "Новий сайт");
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    const renamed = await screen.findAllByText("Новий сайт");
    expect(renamed.length).toBeGreaterThan(0);

    await user.click(getFirstMenuButton(container));
    await user.click(screen.getByText("Видалити"));
    await user.click(screen.getByRole("button", { name: "Перемістити" }));

    await waitFor(() => {
      expect(screen.queryByText("Новий сайт")).not.toBeInTheDocument();
    });

    await user.click(getFirstMenuButton(container));
    await user.click(screen.getByText("Колекції"));

    expect(await screen.findByText("Колекції")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    await waitFor(() => {
      expect(screen.queryByText("Колекції")).not.toBeInTheDocument();
    });
  });

  it("opens create sheet, validates form, prevents double submit, and opens builder in new tab", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((value: { id: string }) => void) | null = null;

    createSiteMock.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolveCreate = resolve;
        })
    );

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Створити сайт" }));

    expect(await screen.findByRole("heading", { name: "Створити сайт" })).toBeInTheDocument();
    const nameInput = screen.getByLabelText("Site name");
    const createButton = screen.getByRole("button", { name: "Створити" });

    expect(createButton).toBeDisabled();

    await user.type(nameInput, "   ");
    await user.tab();
    expect(await screen.findByText("Введіть назву сайту")).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "  New Project  ");
    expect(createButton).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Розширені налаштування" }));
    await user.selectOptions(screen.getByLabelText("Type"), "business");
    await user.type(screen.getByLabelText("Description"), "Сайт для бізнесу");
    await user.selectOptions(screen.getByLabelText("Template"), "portfolio");

    await user.click(createButton);
    await user.click(createButton);

    expect(createSiteMock).toHaveBeenCalledTimes(1);
    expect(createSiteMock).toHaveBeenCalledWith({
      name: "New Project",
      type: "business",
      description: "Сайт для бізнесу",
      template: "portfolio",
    });
    expect(screen.getByRole("button", { name: "Створення..." })).toBeDisabled();

    if (!resolveCreate) {
      throw new Error("createSite resolver was not captured");
    }
    resolveCreate({ id: "site-new" });

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith(
        "/builder/site-new?siteName=New%20Project",
        "_blank"
      );
    });
    expect(screen.getByRole("button", { name: "Створити сайт" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Створити сайт" })).not.toBeInTheDocument();
  });

  it("shows a toast when create request fails and keeps sheet open", async () => {
    const user = userEvent.setup();
    createSiteMock.mockRejectedValueOnce(new Error("boom"));

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Створити сайт" }));
    const nameInput = await screen.findByLabelText("Site name");
    await user.type(nameInput, "Test site");
    await user.click(screen.getByRole("button", { name: "Створити" }));

    expect(
      await screen.findByText("Не вдалося створити сайт. Спробуйте ще раз.")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Створити сайт" })).toBeInTheDocument();
  });

  it("closes create sheet on Escape", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Створити сайт" }));
    expect(await screen.findByRole("heading", { name: "Створити сайт" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Створити сайт" })).not.toBeInTheDocument();
    });
  });

  it("closes create sheet on Cancel without creating a site", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Створити сайт" }));
    const nameInput = await screen.findByLabelText("Site name");
    await user.type(nameInput, "Will be canceled");
    await user.click(screen.getByRole("button", { name: "Скасувати" }));

    expect(createSiteMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Створити сайт" })).not.toBeInTheDocument();
    });
  });
});
