import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { WorkspaceRoutes } from "./router";
import { WorkspaceApiProvider } from "../features/workspace/api/WorkspaceApiProvider";
import { publicEnv } from "../shared/env/publicEnv";

const resolveLoginPath = (): string => {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith("/workspace")) {
    return "/auth/authorisation";
  }
  return "/authorisation";
};

const navigateTo = (path: string): void => {
  const userAgent = window.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom") && window.history?.pushState) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  try {
    window.location.assign(path);
  } catch {
    if (window.history?.pushState) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
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
        const targetPath = resolveLoginPath();
        if (window.location.pathname !== targetPath) {
          navigateTo(targetPath);
        }
      },
    });
    authSessionManager
      .bootstrap()
      .then(() => {
        if (!active) {
          return;
        }
        const hasAccessToken = Boolean(authSessionManager.getAccessToken());
        if (hasAccessToken) {
          return;
        }
      })
      .finally(() => {
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
