import { Navigate, Route, Routes } from "react-router-dom";
import { BuilderPage } from "../pages/BuilderPage";

export function BuilderRoutes() {
  return (
    <Routes>
      <Route index element={<BuilderPage />} />
      <Route path=":siteId" element={<BuilderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
