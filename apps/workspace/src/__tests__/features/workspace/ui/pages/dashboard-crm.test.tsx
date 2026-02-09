import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkspaceApiProvider } from "../../../../../features/workspace/api/WorkspaceApiProvider";
import { DashboardPage } from "../../../../../features/workspace/ui/pages/DashboardPage";
import { CRMPage } from "../../../../../features/workspace/ui/pages/CRMPage";

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
