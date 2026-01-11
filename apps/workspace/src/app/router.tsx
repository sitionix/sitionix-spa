import { Route, Routes } from "react-router-dom";
import DashboardPage from "../features/dashboard/ui/DashboardPage";

export function WorkspaceRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  );
}
