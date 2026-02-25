import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { AuthRoutes } from "./router";
import { publicEnv } from "../shared/env/publicEnv";

const navigateToWorkspace = (): void => {
  const userAgent = window.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom") && window.history?.pushState) {
    window.history.pushState({}, "", "/workspace");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  try {
    window.location.assign("/workspace");
  } catch {
    if (window.history?.pushState) {
      window.history.pushState({}, "", "/workspace");
      window.dispatchEvent(new PopStateEvent("popstate"));
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
        const hasAccessToken = Boolean(authSessionManager.getAccessToken());
        if (hasAccessToken) {
          navigateToWorkspace();
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

  return <AuthRoutes />;
}
