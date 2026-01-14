import { createBrowserRouter } from "react-router-dom";
import { AuthRemote } from "../mf/AuthRemote";
import { WorkspaceRemote } from "../mf/WorkspaceRemote";
import { HomePage } from "./HomePage";

export function createShellRouter() {
  return createBrowserRouter(
    [
      { path: "/", element: <HomePage /> },

      // Тут MF буде змонтований всередині Shell
      { path: "/auth/*", element: <AuthRemote basename="/auth" /> },
      { path: "/workspace/*", element: <WorkspaceRemote basename="/workspace" /> },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );
}
