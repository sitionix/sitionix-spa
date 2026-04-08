import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import type { WorkspaceApi } from "../../../../../features/workspace/api/workspaceApi";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { CollectionsPage } from "../../../../../features/workspace/ui/pages/CollectionsPage";
import { DomainsPage } from "../../../../../features/workspace/ui/pages/DomainsPage";
import { TrashPage } from "../../../../../features/workspace/ui/pages/TrashPage";

const { createApi } = vi.hoisted(() => ({
  createApi: () => {
    let trashItems = [
      {
        id: "site-trash-1",
        name: "Тестовий лендинг",
        domain: "landing.sitionix.com",
        deletedAt: "2026-04-08T10:00:00.000Z",
      },
    ];

    const api: WorkspaceApi = {
      getCollections: vi.fn().mockResolvedValue({
        items: [
          {
            id: "collection-1",
            name: "Клієнтські проекти",
            color: "blue",
            sitesCount: 3,
          },
        ],
        meta: { page: 1, size: 1, totalItems: 1, totalPages: 1 },
      }),
      getDomains: vi.fn().mockResolvedValue({
        items: [
          {
            id: "domain-1",
            domain: "corporate.sitionix.com",
            expiresAt: "2027-04-08T10:00:00.000Z",
            status: "active",
          },
        ],
        meta: { page: 1, size: 1, totalItems: 1, totalPages: 1 },
      }),
      getTrash: vi.fn().mockImplementation(async () => ({
        items: [...trashItems],
        meta: { page: 1, size: trashItems.length, totalItems: trashItems.length, totalPages: 1 },
      })),
      restoreSite: vi.fn().mockImplementation(async (siteId: string) => {
        trashItems = trashItems.filter((item) => item.id !== siteId);
      }),
      permanentlyDeleteSite: vi.fn().mockImplementation(async (siteId: string) => {
        trashItems = trashItems.filter((item) => item.id !== siteId);
      }),
      clearTrash: vi.fn().mockImplementation(async () => {
        trashItems = [];
      }),
    } as unknown as WorkspaceApi;

    return api;
  },
}));

let api = createApi();

vi.mock("../../../../../features/workspace/api/WorkspaceApiProvider", () => ({
  WorkspaceApiProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkspaceApi: () => api,
}));

describe("CollectionsPage", () => {
  it("renders collections list", async () => {
    api = createApi();
    render(
      <MemoryRouter initialEntries={["/collections"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/collections" element={<CollectionsPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Колекції")).toBeInTheDocument();
    expect(screen.getByText("Клієнтські проекти")).toBeInTheDocument();
  });
});

describe("DomainsPage", () => {
  it("renders domains list", async () => {
    api = createApi();
    render(
      <MemoryRouter initialEntries={["/domains"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/domains" element={<DomainsPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Домени")).toBeInTheDocument();
    expect(screen.getByText("corporate.sitionix.com")).toBeInTheDocument();
  });
});

describe("TrashPage", () => {
  it("restores items from trash", async () => {
    api = createApi();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/trash"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/trash" element={<TrashPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Кошик/)).toBeInTheDocument();
    expect(await screen.findByText("Тестовий лендинг")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Відновити/ }));

    await waitFor(() => {
      expect(screen.queryByText("Тестовий лендинг")).not.toBeInTheDocument();
    });
  });

  it("clears trash and shows empty state", async () => {
    api = createApi();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/trash"]}>
        <WorkspaceApiProvider>
          <Routes>
            <Route path="/trash" element={<TrashPage />} />
          </Routes>
        </WorkspaceApiProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Кошик/)).toBeInTheDocument();
    await screen.findByRole("button", { name: "Очистити кошик" });

    await user.click(screen.getByRole("button", { name: "Очистити кошик" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Очистити кошик" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(await screen.findByText("Кошик порожній")).toBeInTheDocument();
  });
});
