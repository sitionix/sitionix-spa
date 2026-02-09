import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../../../../features/workspace/ui/layout/Sidebar";
import { TopBar } from "../../../../features/workspace/ui/layout/TopBar";
import { WorkspaceLayout } from "../../../../features/workspace/ui/layout/WorkspaceLayout";

describe("layout", () => {
  it("renders Sidebar and highlights active link", () => {
    render(
      <MemoryRouter initialEntries={["/domains"]}>
        <Sidebar />
      </MemoryRouter>
    );

    const link = screen.getByText("Домени").closest("a");
    expect(link?.className).toContain("bg-blue-50");
  });

  it("renders TopBar and toggles profile menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/sites"]}>
        <TopBar />
      </MemoryRouter>
    );

    expect(screen.getByText("Вебсайти")).toBeInTheDocument();

    const toggleButton = screen.getByText("WS").closest("button");
    if (!toggleButton) {
      throw new Error("Profile toggle not found");
    }
    await user.click(toggleButton);

    expect(screen.getByText("Профіль")).toBeInTheDocument();
  });

  it("renders WorkspaceLayout with outlet", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<WorkspaceLayout />}>
            <Route index element={<div>Outlet Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Outlet Content")).toBeInTheDocument();
    expect(screen.getByText("Sitionix")).toBeInTheDocument();
  });
});
