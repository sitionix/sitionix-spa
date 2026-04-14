import { getOrCreateSessionSourceId } from "../device/sessionSourceId";

export type RefreshAccessTokenRequest = {
  sessionSourceId: string;
};

export type RefreshAccessTokenResponse = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
};

export class RefreshClientError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "RefreshClientError";
    this.status = status;
  }
}

export type RefreshClient = () => Promise<RefreshAccessTokenResponse>;

export type RefreshClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export function createRefreshClient(options: RefreshClientOptions = {}): RefreshClient {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetchImpl ?? fetch;

  return async () => {
    const payload: RefreshAccessTokenRequest = {
      sessionSourceId: getOrCreateSessionSourceId(),
    };

    const response = await fetchImpl(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const refreshResponse = (isJson ? await response.json() : null) as
      | RefreshAccessTokenResponse
      | null;

    if (!response.ok) {
      throw new RefreshClientError("Failed to refresh access token", response.status);
    }

    if (
      !refreshResponse ||
      typeof refreshResponse.accessToken !== "string" ||
      typeof refreshResponse.expiresIn !== "number" ||
      typeof refreshResponse.tokenType !== "string"
    ) {
      throw new RefreshClientError("Invalid refresh response payload", response.status);
    }

    return refreshResponse;
  };
}
