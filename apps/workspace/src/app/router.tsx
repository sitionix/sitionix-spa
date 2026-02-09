import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../features/workspace/ui/pages/DashboardPage";
import { SitesPage } from "../features/workspace/ui/pages/SitesPage";
import { CollectionsPage } from "../features/workspace/ui/pages/CollectionsPage";
import { DomainsPage } from "../features/workspace/ui/pages/DomainsPage";
import { TrashPage } from "../features/workspace/ui/pages/TrashPage";
import { SiteSettingsPage } from "../features/workspace/ui/pages/SiteSettingsPage";
import { SiteEditorPage } from "../features/workspace/ui/pages/SiteEditorPage";
import { CRMPage } from "../features/workspace/ui/pages/CRMPage";
import { WorkspaceLayout } from "../features/workspace/ui/layout/WorkspaceLayout";

export function WorkspaceRoutes() {
  return (
    <Routes>
      <Route element={<WorkspaceLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="sites/:siteId/settings" element={<SiteSettingsPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="crm" element={<CRMPage />} />
      </Route>

      <Route path="editor/:siteId" element={<SiteEditorPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
