import { useEffect } from "react";
import { authSessionManager } from "@sitionix/auth-session";
import { AuthRoutes } from "./router";
import { publicEnv } from "../shared/env/publicEnv";

export function App() {
  useEffect(() => {
    authSessionManager.configure({ baseUrl: publicEnv.apiBaseUrl });
  }, []);

  return <AuthRoutes />;
}
