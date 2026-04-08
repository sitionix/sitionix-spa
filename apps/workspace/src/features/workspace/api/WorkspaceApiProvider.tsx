import { createContext, useContext, useMemo, type ReactNode } from "react";
import { requestJson } from "../../../shared/http/httpClient";
import { publicEnv } from "../../../shared/env/publicEnv";
import { createWorkspaceApi } from "./workspaceApi";
import type { WorkspaceApi } from "./workspaceApi";

const WorkspaceApiContext = createContext<WorkspaceApi | null>(null);

export function WorkspaceApiProvider({ children }: { children: ReactNode }) {
  const api = useMemo(
    () =>
      createWorkspaceApi({
        baseUrl: publicEnv.apiBaseUrl,
        requestJson,
      }),
    []
  );

  return (
    <WorkspaceApiContext.Provider value={api}>
      {children}
    </WorkspaceApiContext.Provider>
  );
}

export function useWorkspaceApi() {
  const api = useContext(WorkspaceApiContext);
  if (!api) {
    throw new Error("useWorkspaceApi must be used within WorkspaceApiProvider");
  }
  return api;
}
