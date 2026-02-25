import { Navigate, createBrowserRouter } from "react-router-dom";
import { AuthRemote } from "../mf/AuthRemote";
import { WorkspaceRemote } from "../mf/WorkspaceRemote";
import { BuilderRemote } from "../mf/BuilderRemote";
import { HomePage } from "./HomePage";

type CreateShellRouterOptions = {
  isAuthenticated: boolean;
};

export function createShellRouter(options: CreateShellRouterOptions) {
  const homeElement = options.isAuthenticated ? (
    <Navigate to="/workspace" replace />
  ) : (
    <HomePage />
  );

  return createBrowserRouter(
    [
      { path: "/", element: homeElement },

      // Тут MF буде змонтований всередині Shell
      { path: "/auth/*", element: <AuthRemote basename="/auth" /> },
      { path: "/workspace/*", element: <WorkspaceRemote basename="/workspace" /> },
      { path: "/builder/*", element: <BuilderRemote basename="/builder" /> },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );
}
