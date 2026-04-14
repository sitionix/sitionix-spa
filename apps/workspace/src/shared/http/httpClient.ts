import { authSessionManager, createBffFetchWithAuthRetry } from "@sitionix/auth-session";
import { Configuration } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable";
import { configureAuthSessionBridge, createRequestJson } from "@sitionix/http-client";
import { publicEnv } from "../env/publicEnv";

configureAuthSessionBridge({
  getAccessToken: () => authSessionManager.getAccessToken(),
  refresh: () => authSessionManager.refresh(),
});

export const requestJson = createRequestJson(publicEnv.apiBaseUrl);

export const bffApiConfiguration = new Configuration({
  basePath: publicEnv.apiBaseUrl,
  credentials: "include",
  fetchApi: createBffFetchWithAuthRetry(publicEnv.apiBaseUrl, {
    getAccessToken: () => authSessionManager.getAccessToken(),
    refresh: () => authSessionManager.refresh(),
  }),
  accessToken: async () => authSessionManager.getAccessToken() ?? "",
});
