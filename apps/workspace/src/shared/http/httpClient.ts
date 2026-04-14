import { authSessionManager, createBffHttpClient } from "@sitionix/auth-session";
import { Configuration } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable";
import { publicEnv } from "../env/publicEnv";

const bffHttpClient = createBffHttpClient(publicEnv.apiBaseUrl, authSessionManager);

export const requestJson = bffHttpClient.requestJson;

export const bffApiConfiguration = new Configuration({
  ...bffHttpClient.configuration,
});
