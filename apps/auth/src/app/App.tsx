import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { AuthRoutes } from "./router";
import { publicEnv } from "../shared/env/publicEnv";

const navigateToWorkspace = (): void => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return;
  }

  const userAgent = browserWindow.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom") && browserWindow.history?.pushState) {
    browserWindow.history.pushState({}, "", "/workspace");
    browserWindow.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  try {
    browserWindow.location.assign("/workspace");
  } catch {
    if (browserWindow.history?.pushState) {
      browserWindow.history.pushState({}, "", "/workspace");
      browserWindow.dispatchEvent(new PopStateEvent("popstate"));
    }
  }
};

export function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;
    authSessionManager.configure({ baseUrl: publicEnv.apiBaseUrl });
    authSessionManager
      .bootstrap()
      .then(() => {
        if (!active) {
          return;
        }

        if (authSessionManager.getAccessToken()) {
          navigateToWorkspace();
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

  return <AuthRoutes />;
}
