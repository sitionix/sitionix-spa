import { useEffect, useState } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { navigateInBrowser } from "@sitionix/ui";
import { AuthRoutes } from "./router";
import { publicEnv } from "../shared/env/publicEnv";

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
          navigateInBrowser("/workspace");
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
