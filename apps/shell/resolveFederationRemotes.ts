export type ShellRemoteId = "auth" | "workspace" | "builder";

type ResolveFederationRemotesOptions = {
  isDev: boolean;
  env?: NodeJS.ProcessEnv;
};

const REMOTE_ENV_KEYS: Record<ShellRemoteId, string> = {
  auth: "VITE_AUTH_REMOTE_ORIGIN",
  workspace: "VITE_WORKSPACE_REMOTE_ORIGIN",
  builder: "VITE_BUILDER_REMOTE_ORIGIN",
};

const DEV_REMOTE_ENTRY_PATH = "/remoteEntry.js";
const BUILD_REMOTE_ENTRY_PATH = "/assets/remoteEntry.js";

const normalizeOrigin = (value: string, envKey: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Missing required env variable: ${envKey}`);
  }

  return trimmed.replace(/\/+$/, "");
};

const buildRemoteEntryUrl = (origin: string, isDev: boolean): string =>
  `${origin}${isDev ? DEV_REMOTE_ENTRY_PATH : BUILD_REMOTE_ENTRY_PATH}`;

export const resolveFederationRemotes = ({
  isDev,
  env = process.env,
}: ResolveFederationRemotesOptions): Record<ShellRemoteId, string> => ({
  auth: buildRemoteEntryUrl(
    normalizeOrigin(env[REMOTE_ENV_KEYS.auth] ?? "", REMOTE_ENV_KEYS.auth),
    isDev
  ),
  workspace: buildRemoteEntryUrl(
    normalizeOrigin(
      env[REMOTE_ENV_KEYS.workspace] ?? "",
      REMOTE_ENV_KEYS.workspace
    ),
    isDev
  ),
  builder: buildRemoteEntryUrl(
    normalizeOrigin(
      env[REMOTE_ENV_KEYS.builder] ?? "",
      REMOTE_ENV_KEYS.builder
    ),
    isDev
  ),
});
