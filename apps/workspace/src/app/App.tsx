import { WorkspaceRoutes } from "./router";
import { WorkspaceApiProvider } from "../features/workspace/api/WorkspaceApiProvider";

export function App() {
  return (
    <WorkspaceApiProvider>
      <WorkspaceRoutes />
    </WorkspaceApiProvider>
  );
}
