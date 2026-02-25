import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
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

const navigateTo = (path: string): void => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return;
  }

  const userAgent = browserWindow.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom") && browserWindow.history?.pushState) {
    browserWindow.history.pushState({}, "", path);
    browserWindow.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  try {
    browserWindow.location.assign(path);
  } catch {
    if (browserWindow.history?.pushState) {
      browserWindow.history.pushState({}, "", path);
      browserWindow.dispatchEvent(new PopStateEvent("popstate"));
    }
  }
};

export function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;
    authSessionManager.configure({
      baseUrl: publicEnv.apiBaseUrl,
      onUnauthenticated: () => {
        const browserWindow = globalThis.window;
        if (!browserWindow) {
          return;
        }

        const targetPath = resolveLoginPath();
        if (browserWindow.location.pathname !== targetPath) {
          navigateTo(targetPath);
        }
      },
    });

    authSessionManager.bootstrap().finally(() => {
      if (active) {
        setBootstrapped(true);
      }
    });

    return () => {
      active = false;
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
