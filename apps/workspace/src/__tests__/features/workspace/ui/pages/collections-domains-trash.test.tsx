import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { CollectionsPage } from "../../../../../features/workspace/ui/pages/CollectionsPage";
import { DomainsPage } from "../../../../../features/workspace/ui/pages/DomainsPage";
import { TrashPage } from "../../../../../features/workspace/ui/pages/TrashPage";

describe("CollectionsPage", () => {
  it("renders collections list", async () => {
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
