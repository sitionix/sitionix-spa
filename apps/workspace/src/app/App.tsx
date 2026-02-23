import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { WorkspaceRoutes } from "./router";
import { WorkspaceApiProvider } from "../features/workspace/api/WorkspaceApiProvider";
import { requestJson } from "../shared/http/httpClient";
import type { SessionState } from "@sitionix/auth-session";

export function App() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const result = await requestJson<SessionState, unknown, undefined>({
        method: "GET",
        path: "/api/v1/session",
      });

      if (cancelled) {
        return;
      }

      if (result.ok && result.data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setIsCheckingSession(false);
    };

    checkSession().catch(() => {
      if (!cancelled) {
        setIsAuthenticated(false);
        setIsCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isCheckingSession) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/authorisation" replace />;
  }

  return (
    <WorkspaceApiProvider>
      <WorkspaceRoutes />
    </WorkspaceApiProvider>
  );
}
