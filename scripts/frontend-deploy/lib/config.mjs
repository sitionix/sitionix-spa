import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../../..");
const configPath = path.resolve(
  repoRoot,
  "deploy/frontend/config/deployment-targets.json"
);

export const loadDeploymentConfig = () =>
  JSON.parse(fs.readFileSync(configPath, "utf8"));

export const getEnvironmentById = (config, environmentId) => {
  const environment = config.environments.find((entry) => entry.id === environmentId);
  if (!environment) {
    throw new Error(`Unknown deployment environment: ${environmentId}`);
  }
  return environment;
};

export const getEnvironmentByBranch = (config, branch) =>
  config.environments.find((entry) => (entry.branches ?? []).includes(branch)) ?? null;

export const getApplicationById = (config, applicationId) => {
  const application = config.applications.find((entry) => entry.id === applicationId);
  if (!application) {
    throw new Error(`Unknown application id: ${applicationId}`);
  }
  return application;
};

export const getApplicationByName = (config, applicationName) => {
  const application = config.applications.find((entry) => entry.name === applicationName);
  if (!application) {
    throw new Error(`Unknown application name: ${applicationName}`);
  }
  return application;
};

export const selectApplications = (config, selector) => {
  if (!selector || selector === "all") {
    return [...config.applications];
  }

  try {
    return [getApplicationById(config, selector)];
  } catch {
    return [getApplicationByName(config, selector)];
  }
};

export const toOrigin = (host) => `https://${host}`;

export const getOrigins = (environment) => ({
  shell: toOrigin(environment.hosts.shell),
  auth: toOrigin(environment.hosts.auth),
  workspace: toOrigin(environment.hosts.workspace),
  builder: toOrigin(environment.hosts.builder),
});

export const getBuildEnvironmentVariables = (environment) => {
  const origins = getOrigins(environment);
  return {
    VITE_API_BASE_URL: environment.publicEnv.apiBaseUrl,
    VITE_SHELL_ORIGIN: origins.shell,
    VITE_AUTH_REMOTE_ORIGIN: origins.auth,
    VITE_WORKSPACE_REMOTE_ORIGIN: origins.workspace,
    VITE_BUILDER_REMOTE_ORIGIN: origins.builder,
  };
};

const tokenizeCommand = (body) => {
  const firstLine = body
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return [];
  }

  return [...firstLine.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/gu)].map(
    (match) => match[1] ?? match[2] ?? match[3]
  );
};

export const parseDeployComment = (config, body) => {
  const tokens = tokenizeCommand(body);
  const prefix = config.deploymentCommand.prefix;

  if (!tokens.length || tokens[0] !== prefix) {
    return { matched: false };
  }

  const parsed = {
    matched: true,
    applicationSelector: null,
    environmentId: null,
  };

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "--all") {
      parsed.applicationSelector = "all";
      continue;
    }

    if (token === "--name" || token === "--env") {
      const value = tokens[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${token} in deploy comment`);
      }
      if (token === "--name") {
        parsed.applicationSelector = value;
      } else {
        parsed.environmentId = value;
      }
      index += 1;
      continue;
    }

    throw new Error(`Unsupported deploy flag: ${token}`);
  }

  if (!parsed.environmentId) {
    throw new Error("Deploy comment must include --env <environment>");
  }

  if (!parsed.applicationSelector) {
    throw new Error('Deploy comment must include --name "<Application Name>" or --all');
  }

  return parsed;
};

export const getRemoteEntryUrlsForVerification = (applications, environment) => {
  const origins = getOrigins(environment);
  const remoteApplications = applications.some((application) => application.id === "shell")
    ? ["auth", "workspace", "builder"]
    : applications
        .filter((application) => application.expectsRemoteEntry)
        .map((application) => application.id);

  return remoteApplications.map((applicationId) => `${origins[applicationId]}/assets/remoteEntry.js`);
};

export const getPublicUrlsForVerification = (applications, environment) => {
  const origins = getOrigins(environment);
  return applications.map((application) => origins[application.hostKey]);
};
