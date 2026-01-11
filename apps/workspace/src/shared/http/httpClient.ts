import { createRequestJson } from "@sitionix/http-client";
import { publicEnv } from "../env/publicEnv";

export type {
  HttpMethod,
  HttpRequestOptions,
  HttpResponse,
  HttpErrorResponse,
  HttpResult,
} from "@sitionix/http-client";

export const requestJson = createRequestJson(publicEnv.apiBaseUrl);
