import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { navigateInBrowser } from "@sitionix/ui";
import { WorkspaceRoutes } from "./router";
import { WorkspaceApiProvider } from "../features/workspace/api/WorkspaceApiProvider";
import { publicEnv } from "../shared/env/publicEnv";

const resolveLoginPath = (): string => {
  const currentPath = globalThis.window?.location.pathname ?? "/";
  if (currentPath.startsWith("/workspace")) {
    return "/auth/authorisation";
  }
  return "/authorisation";
};

export function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;
    authSessionManager.configure({
      baseUrl: publicEnv.apiBaseUrl,
    });
    const unsubscribeUnauthenticated = authSessionManager.onUnauthenticated(() => {
      const browserWindow = globalThis.window;
      if (!browserWindow) {
        return;
      }

      const targetPath = resolveLoginPath();
      if (browserWindow.location.pathname !== targetPath) {
        navigateInBrowser(targetPath);
      }
    });

    authSessionManager.bootstrap().finally(() => {
      if (active) {
        setBootstrapped(true);
      }
    });

    return () => {
      active = false;
      unsubscribeUnauthenticated();
    };
  }, []);

  if (!bootstrapped) {
    return null;
  }

  return (
    <WorkspaceApiProvider>
      <WorkspaceRoutes />
    </WorkspaceApiProvider>
  );
}
