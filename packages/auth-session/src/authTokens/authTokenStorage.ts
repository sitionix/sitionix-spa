import { authSessionManager } from "../AuthSessionManager";

export type AuthTokens = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
};

export function saveAuthTokens(tokens: AuthTokens): void {
  authSessionManager.setAccessToken(tokens.accessToken, tokens.expiresIn);
}
