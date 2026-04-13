import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import type {
  WorkspaceCollection,
  WorkspaceSite,
} from "../../../../../features/workspace/model/workspaceTypes";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { SitesPage } from "../../../../../features/workspace/ui/pages/SitesPage";

const { navigateHostMock } = vi.hoisted(() => ({
  navigateHostMock: vi.fn(),
}));

const getFirstMenuButton = (container: HTMLElement) => {
  const icon = container.querySelector("svg.lucide-ellipsis-vertical");
  const button = icon?.closest("button") as HTMLButtonElement | null;
  if (!button) {
    throw new Error("Menu button not found");
  }
  return button;
};

const createSiteItem = (id: string, name: string): WorkspaceSite => ({
  id,
  name,
  domain: "",
  description: null,
  seoTitle: null,
  seoDescription: null,
  type: "standalone",
  status: "draft",
  createdAt: "2026-02-01T12:00:00.000Z",
  updatedAt: "2026-02-01T12:00:00.000Z",
  visits: 0,
  ecosystemName: null,
  collectionId: null,
  thumbnailUrl: null,
});

const createPageResponse = (
  items: WorkspaceSite[],
  overrides?: Partial<{ page: number; size: number; totalItems: number; totalPages: number }>
) => ({
  items,
  meta: {
    page: overrides?.page ?? 0,
    size: overrides?.size ?? 20,
    totalItems: overrides?.totalItems ?? items.length,
    totalPages: overrides?.totalPages ?? 1,
  },
});

type IntersectionEntry = Pick<IntersectionObserverEntry, "isIntersecting">;

class MockIntersectionObserver {
  static callback: ((entries: IntersectionEntry[]) => void) | null = null;
  static observe = vi.fn();
  static disconnect = vi.fn();

  constructor(callback: (entries: IntersectionEntry[]) => void) {
    MockIntersectionObserver.callback = callback;
  }

  observe = MockIntersectionObserver.observe;
  disconnect = MockIntersectionObserver.disconnect;
}

const { api, resetSites, createSiteMock, getSitesMock, restoreGetSitesMock } = vi.hoisted(() => {
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
  const getSitesMock = vi.fn();
  const restoreGetSitesMock = () => {
    getSitesMock.mockReset();
    getSitesMock.mockImplementation(() =>
      Promise.resolve({
        items: sites,
        meta: {
          page: 0,
          size: sites.length,
          totalItems: sites.length,
          totalPages: 1,
        },
      })
    );
  };
  const cloneSites = () => initialSites.map((site) => ({ ...site }));
  let sites = cloneSites();

  const resetSites = () => {
    sites = cloneSites();
    restoreGetSitesMock();
  };

  const collections: WorkspaceCollection[] = [
    { id: "col-1", name: "Клієнтські проекти", color: "blue", sitesCount: 1 },
  ];

  const api: WorkspaceApi = {
    getSites: getSitesMock,
    getCollections: vi.fn().mockResolvedValue({
      items: collections,
      meta: {
        page: 1,
        size: collections.length,
        totalItems: collections.length,
        totalPages: 1,
      },
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

  restoreGetSitesMock();
  return { api, resetSites, createSiteMock, getSitesMock, restoreGetSitesMock };
});

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

vi.mock("../../../../../features/workspace/api/sitesApi", () => ({
  createSite: createSiteMock,
  getSites: getSitesMock,
  sitesApi: {
    getSites: getSitesMock,
    createSite: createSiteMock,
  },
}));

vi.mock("../../../../../shared/navigation/navigateHost", () => ({
  navigateHost: navigateHostMock,
}));

describe("SitesPage", () => {
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;
  let originalIntersectionObserver: typeof window.IntersectionObserver | undefined;

  beforeEach(() => {
    resetSites();
    restoreGetSitesMock();
    createSiteMock.mockReset();
    createSiteMock.mockResolvedValue({ id: "site-new" });
    vi.mocked(api.addToCollection).mockClear();
    vi.mocked(api.removeFromCollection).mockClear();
    vi.mocked(api.duplicateSite).mockClear();
    navigateHostMock.mockReset();
    windowOpenSpy = vi.spyOn(window, "open").mockReturnValue(null);
    originalIntersectionObserver = window.IntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    windowOpenSpy.mockRestore();
    if (originalIntersectionObserver) {
      window.IntersectionObserver = originalIntersectionObserver;
    } else {
      delete (window as Window & { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
    }
    MockIntersectionObserver.callback = null;
    MockIntersectionObserver.observe.mockReset();
    MockIntersectionObserver.disconnect.mockReset();
  });

  it("renders sites and supports delete/collection actions", async () => {
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
    await user.click(screen.getByText("Видалити"));
    await user.click(screen.getByRole("button", { name: "Перемістити" }));

    await waitFor(() => {
      expect(screen.queryByText("Портфоліо агенції")).not.toBeInTheDocument();
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
    const focusSpy = vi.fn();

    createSiteMock.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolveCreate = resolve;
        })
    );
    windowOpenSpy.mockReturnValue({ focus: focusSpy } as unknown as Window);

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
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Створити сайт" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Створити сайт" })).not.toBeInTheDocument();
  });

  it("refreshes sites list and prevents overlapping refresh requests", async () => {
    const user = userEvent.setup();
    const initialItems = [createSiteItem("site-1", "Початковий сайт")];
    let resolveRefresh: ((value: ReturnType<typeof createPageResponse>) => void) | null = null;

    getSitesMock.mockReset();
    getSitesMock
      .mockResolvedValueOnce(createPageResponse(initialItems))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
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

    await screen.findByRole("button", { name: "Початковий сайт" });
    const refreshButton = screen.getByRole("button", { name: "Refresh" });

    await user.click(refreshButton);
    expect(getSitesMock).toHaveBeenCalledTimes(2);
    expect(refreshButton).toBeDisabled();

    await user.click(refreshButton);
    expect(getSitesMock).toHaveBeenCalledTimes(2);

    if (!resolveRefresh) {
      throw new Error("refresh resolver was not captured");
    }
    resolveRefresh(createPageResponse(initialItems));

    await waitFor(() => {
      expect(refreshButton).toBeEnabled();
    });
  });

  it("loads next page on sentinel intersection and deduplicates repeated ids", async () => {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    let resolveNextPage: ((value: ReturnType<typeof createPageResponse>) => void) | null = null;
    getSitesMock.mockReset();
    getSitesMock
      .mockResolvedValueOnce(
        createPageResponse(
          [createSiteItem("site-1", "Перший сайт")],
          { page: 0, totalPages: 2, totalItems: 2 }
        )
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextPage = resolve;
          })
      );

    const { container } = render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/editor/:siteId" element={<div>Editor Route</div>} />
            <Route path="/sites/:siteId/settings" element={<div>Settings Route</div>} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("button", { name: "Перший сайт" })).toBeInTheDocument();
    expect(MockIntersectionObserver.observe).toHaveBeenCalled();
    expect(MockIntersectionObserver.callback).toBeTruthy();

    if (!MockIntersectionObserver.callback) {
      throw new Error("IntersectionObserver callback was not set");
    }

    MockIntersectionObserver.callback([{ isIntersecting: true }]);

    expect(await screen.findByText("Завантаження...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();

    if (!resolveNextPage) {
      throw new Error("next page resolver was not captured");
    }

    resolveNextPage(
      createPageResponse(
        [
          createSiteItem("site-1", "Перший сайт"),
          createSiteItem("site-2", "Другий сайт"),
        ],
        { page: 1, totalPages: 2, totalItems: 2 }
      )
    );

    await waitFor(() => {
      expect(screen.queryByText("Завантаження...")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Другий сайт" })).toBeInTheDocument();
    expect(container.querySelectorAll("button").length).toBeGreaterThan(1);
    expect(screen.getByText("Мої сайти (2)")).toBeInTheDocument();

  });

  it("shows error when next page loading fails", async () => {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    getSitesMock.mockReset();
    getSitesMock
      .mockResolvedValueOnce(
        createPageResponse(
          [createSiteItem("site-1", "Перший сайт")],
          { page: 0, totalPages: 2, totalItems: 2 }
        )
      )
      .mockRejectedValueOnce(new Error("next page failed"));

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/sites" element={<SitesPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("button", { name: "Перший сайт" })).toBeInTheDocument();

    if (!MockIntersectionObserver.callback) {
      throw new Error("IntersectionObserver callback was not set");
    }

    MockIntersectionObserver.callback([{ isIntersecting: true }]);

    expect(await screen.findByText("next page failed")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Завантаження...")).not.toBeInTheDocument();
    });
  });

  it("supports duplicate menu action and remove from collection", async () => {
    const user = userEvent.setup();
    const duplicateSite = vi.mocked(api.duplicateSite);
    const removeFromCollection = vi.mocked(api.removeFromCollection);
    const addToCollection = vi.mocked(api.addToCollection);

    render(
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

    expect(await screen.findByText("Мої сайти (2)")).toBeInTheDocument();

    const menuButtonForDuplicate = document.querySelector("svg.lucide-ellipsis-vertical")?.closest("button");
    if (!(menuButtonForDuplicate instanceof HTMLButtonElement)) {
      throw new Error("menu button not found");
    }
    await user.click(menuButtonForDuplicate);
    await user.click(screen.getByText("Дублювати"));
    await waitFor(() => {
      expect(duplicateSite).toHaveBeenCalledWith("site-1");
    });

    const secondMenuButton = document.querySelector("svg.lucide-ellipsis-vertical")?.closest("button");
    if (!(secondMenuButton instanceof HTMLButtonElement)) {
      throw new Error("second menu button not found");
    }
    await user.click(secondMenuButton);
    await user.click(screen.getByText("Колекції"));
    await user.click(screen.getByLabelText("Без колекції"));
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    await waitFor(() => {
      expect(removeFromCollection).toHaveBeenCalledTimes(1);
    });
    expect(addToCollection).not.toHaveBeenCalled();
  });

  it("opens builder from primary action button", async () => {
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

    expect(await screen.findByText("Мої сайти (2)")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Редагувати сайт" })[0]);
    expect(navigateHostMock).toHaveBeenCalledWith("/builder/site-1");
  });

  it("opens overview from preview card, title, and settings actions", async () => {
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

    expect(await screen.findByText("Мої сайти (2)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Портфоліо агенції" }));
    expect(navigateHostMock).toHaveBeenNthCalledWith(
      1,
      "/workspace/sites/site-1/settings"
    );

    await user.click(screen.getAllByRole("button", { name: "Портфоліо агенції" })[1]);
    expect(navigateHostMock).toHaveBeenNthCalledWith(
      2,
      "/workspace/sites/site-1/settings"
    );

    await user.click(screen.getAllByRole("button", { name: "Налаштування" })[0]);
    expect(navigateHostMock).toHaveBeenNthCalledWith(
      3,
      "/workspace/sites/site-1/settings"
    );

    const firstMenuButton = document.querySelector("svg.lucide-ellipsis-vertical")?.closest("button");
    if (!(firstMenuButton instanceof HTMLButtonElement)) {
      throw new Error("first menu button not found");
    }

    await user.click(firstMenuButton);
    const settingsActions = screen.getAllByRole("button", { name: "Налаштування" });
    const menuSettingsAction = settingsActions.find((button) =>
      button.className.includes("w-full")
    );
    if (!menuSettingsAction) {
      throw new Error("menu settings action not found");
    }
    await user.click(menuSettingsAction);
    expect(navigateHostMock).toHaveBeenNthCalledWith(
      4,
      "/workspace/sites/site-1/settings"
    );
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
