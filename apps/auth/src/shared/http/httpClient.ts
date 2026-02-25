import { authSessionManager } from "@sitionix/auth-session";
import { configureAuthSessionBridge, createRequestJson } from "@sitionix/http-client";
import { publicEnv } from "../env/publicEnv";

export type {
  HttpMethod,
  HttpRequestOptions,
  HttpResponse,
  HttpErrorResponse,
  HttpResult,
} from "@sitionix/http-client";

configureAuthSessionBridge({
  getAccessToken: () => authSessionManager.getAccessToken(),
  refresh: () => authSessionManager.refresh(),
});

export const requestJson = createRequestJson(publicEnv.apiBaseUrl);
