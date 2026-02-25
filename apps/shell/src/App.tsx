import { useEffect, useMemo, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { authSessionManager } from "@sitionix/auth-session";
import { createShellRouter } from "./app/router";
import { publicEnv } from "./shared/env/publicEnv";

type AuthInitState = "loading" | "ready";

export function App() {
  const [authInitState, setAuthInitState] = useState<AuthInitState>("loading");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const shouldBootstrap = globalThis.window?.location.pathname === "/";

    if (!shouldBootstrap) {
      setAuthInitState("ready");
      return () => {
        isMounted = false;
      };
    }

    authSessionManager.configure({
      baseUrl: publicEnv.apiBaseUrl,
    });

    authSessionManager
      .bootstrap()
      .then(() => {
        if (!isMounted) {
          return;
        }
        setIsAuthenticated(Boolean(authSessionManager.getAccessToken()));
      })
      .finally(() => {
        if (isMounted) {
          setAuthInitState("ready");
        }
      });

    const unsubscribe = authSessionManager.onUnauthenticated(() => {
      if (isMounted) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const router = useMemo(
    () => createShellRouter({ isAuthenticated }),
    [isAuthenticated]
  );

  if (authInitState === "loading") {
    return <div className="p-6 text-sm text-slate-600">Loading session...</div>;
  }

  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
