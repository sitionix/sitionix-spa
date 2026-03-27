import fs from "node:fs";
import path from "node:path";
import { parseNamedCommand } from "./cli.mjs";
import { deployConfigRoot, deployEnvironmentsRoot, repoRoot } from "./paths.mjs";

const loadJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const FRONTEND_HOST_ENV_KEYS = {
  shell: "FRONTEND_HOST_SHELL",
  auth: "FRONTEND_HOST_AUTH",
  workspace: "FRONTEND_HOST_WORKSPACE",
  builder: "FRONTEND_HOST_BUILDER",
};

const FRONTEND_SSL_ENV_KEYS = {
  shell: {
    certificatePath: "DEPLOY_SSL_SHELL_CERT_PATH",
    certificateKeyPath: "DEPLOY_SSL_SHELL_KEY_PATH",
  },
  auth: {
    certificatePath: "DEPLOY_SSL_AUTH_CERT_PATH",
    certificateKeyPath: "DEPLOY_SSL_AUTH_KEY_PATH",
  },
  workspace: {
    certificatePath: "DEPLOY_SSL_WORKSPACE_CERT_PATH",
    certificateKeyPath: "DEPLOY_SSL_WORKSPACE_KEY_PATH",
  },
  builder: {
    certificatePath: "DEPLOY_SSL_BUILDER_CERT_PATH",
    certificateKeyPath: "DEPLOY_SSL_BUILDER_KEY_PATH",
  },
};

const readRequiredEnv = (env, key) => {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const readOptionalEnv = (env, key, defaultValue) => env[key]?.trim() || defaultValue;

const loadEnvironmentProfiles = () =>
  fs
    .readdirSync(deployEnvironmentsRoot)
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => loadJsonFile(path.resolve(deployEnvironmentsRoot, entry)));

const ensureUnique = (values, label) => {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${duplicates.join(", ")}`);
  }
};

const validateCatalog = (catalog) => {
  ensureUnique(
    catalog.applications.map((application) => application.id),
    "application id"
  );
  ensureUnique(
    catalog.applications.map((application) => application.name),
    "application name"
  );
  ensureUnique(
    catalog.environments.map((environment) => environment.id),
    "environment id"
  );

  const shellApplications = catalog.applications.filter((application) => application.shellApplication);
  if (shellApplications.length !== 1) {
    throw new Error("Exactly one shell application must be configured");
  }

  for (const application of catalog.applications) {
    if (application.expectsRemoteEntry && !application.remoteEntryPath) {
      throw new Error(`Application ${application.id} expects a remote entry path`);
    }

    if (!application.shellApplication && application.proxyBrowserApi) {
      throw new Error(
        `Only the shell application may proxy browser API requests: ${application.id}`
      );
    }
  }

  return catalog;
};

export const loadDeploymentCatalog = () =>
  validateCatalog({
    command: loadJsonFile(path.resolve(deployConfigRoot, "deployment-command.json")),
    applications: loadJsonFile(path.resolve(deployConfigRoot, "applications.json")).applications,
    environments: loadEnvironmentProfiles(),
  });

export const getEnvironmentById = (catalog, environmentId) => {
  const environment = catalog.environments.find((entry) => entry.id === environmentId);
  if (!environment) {
    throw new Error(`Unknown deployment environment: ${environmentId}`);
  }

  return environment;
};

export const getEnvironmentByBranch = (catalog, branch) =>
  catalog.environments.find((entry) => (entry.branches ?? []).includes(branch)) ?? null;

export const getApplicationById = (catalog, applicationId) => {
  const application = catalog.applications.find((entry) => entry.id === applicationId);
  if (!application) {
    throw new Error(`Unknown application id: ${applicationId}`);
  }

  return application;
};

export const getApplicationByName = (catalog, applicationName) => {
  const application = catalog.applications.find((entry) => entry.name === applicationName);
  if (!application) {
    throw new Error(`Unknown application name: ${applicationName}`);
  }

  return application;
};

export const selectApplications = (catalog, selector) => {
  if (!selector || selector === "all") {
    return [...catalog.applications];
  }

  try {
    return [getApplicationById(catalog, selector)];
  } catch {
    return [getApplicationByName(catalog, selector)];
  }
};

export const toOrigin = (host) => `https://${host}`;

export const materializeDeploymentEnvironment = ({ catalog, environment, env = process.env }) => {
  const hosts = Object.fromEntries(
    catalog.applications.map((application) => [
      application.id,
      readRequiredEnv(env, FRONTEND_HOST_ENV_KEYS[application.id]),
    ])
  );

  const ssl = Object.fromEntries(
    catalog.applications.map((application) => [
      application.id,
      {
        certificatePath: readRequiredEnv(
          env,
          FRONTEND_SSL_ENV_KEYS[application.id].certificatePath
        ),
        certificateKeyPath: readRequiredEnv(
          env,
          FRONTEND_SSL_ENV_KEYS[application.id].certificateKeyPath
        ),
      },
    ])
  );

  return {
    id: environment.id,
    githubEnvironment: environment.githubEnvironment ?? environment.id,
    hosts,
    publicEnv: {
      apiBaseUrl: readRequiredEnv(env, "FRONTEND_API_BASE_URL"),
      workspaceUseMocks: readRequiredEnv(env, "FRONTEND_WORKSPACE_USE_MOCKS"),
    },
    ssl,
    bff: {
      proxyTarget: readRequiredEnv(env, "DEPLOY_BFF_PROXY_TARGET"),
    },
    vm: {
      appRoot: readRequiredEnv(env, "DEPLOY_APP_ROOT"),
      runtimeRoot: readRequiredEnv(env, "DEPLOY_RUNTIME_ROOT"),
      backupRoot: readRequiredEnv(env, "DEPLOY_BACKUP_ROOT"),
      nginxSitePath: readRequiredEnv(env, "DEPLOY_NGINX_SITE_PATH"),
      nginxSiteLinkPath: readRequiredEnv(env, "DEPLOY_NGINX_SITE_LINK_PATH"),
      sudoCommand: readOptionalEnv(env, "DEPLOY_SUDO_COMMAND", "sudo"),
    },
  };
};

const getShellApplication = (catalog) =>
  catalog.applications.find((application) => application.shellApplication);

export const buildDeploymentPlan = ({
  catalog,
  triggerKind,
  environment,
  applications: selectedApplications,
}) => {
  const shellApplication = getShellApplication(catalog);
  const origins = Object.fromEntries(
    catalog.applications.map((application) => [
      application.id,
      toOrigin(environment.hosts[application.id]),
    ])
  );
  const buildEnv = {
    VITE_API_BASE_URL: environment.publicEnv.apiBaseUrl,
    VITE_SHELL_ORIGIN: origins[shellApplication.id],
    VITE_WORKSPACE_USE_MOCKS: environment.publicEnv.workspaceUseMocks,
  };

  for (const application of catalog.applications) {
    if (application.remoteOriginEnvVar) {
      buildEnv[application.remoteOriginEnvVar] = origins[application.id];
    }
  }

  const topologyApplications = catalog.applications.map((application) => ({
    ...application,
    publicUrl: origins[application.id],
  }));
  const resolvedSelectedApplications = selectedApplications.map((application) =>
    topologyApplications.find((candidate) => candidate.id === application.id)
  );
  const verificationApplications = resolvedSelectedApplications.some(
    (application) => application.shellApplication
  )
    ? topologyApplications.filter((application) => application.expectsRemoteEntry)
    : resolvedSelectedApplications.filter((application) => application.expectsRemoteEntry);

  return {
    triggerKind,
    commandPrefix: catalog.command.prefix,
    summary: `${resolvedSelectedApplications.map((application) => application.name).join(", ")} -> ${environment.id}`,
    environment: {
      id: environment.id,
      githubEnvironment: environment.githubEnvironment ?? environment.id,
      hosts: environment.hosts,
      origins,
      shellOrigin: origins[shellApplication.id],
      buildEnv,
      ssl: environment.ssl,
      bff: environment.bff,
      vm: environment.vm,
    },
    applications: topologyApplications,
    selectedApplications: resolvedSelectedApplications,
    verification: {
      publicUrls: resolvedSelectedApplications.map((application) => application.publicUrl),
      remoteEntryUrls: verificationApplications.map(
        (application) => `${origins[application.id]}${application.remoteEntryPath}`
      ),
      shellProxyUrl: `${origins[shellApplication.id]}/bffssox/api/v1/auth/refresh`,
    },
  };
};

export const parseDeployComment = (catalog, body) => {
  const parsedCommand = parseNamedCommand({
    body,
    prefix: catalog.command.prefix,
    definitions: {
      "--all": {
        key: "all",
        type: "flag",
        defaultValue: false,
      },
      "--name": {
        key: "applicationSelector",
        type: "single",
        description: 'Deploy comment must include --name "<Application Name>" or --all',
      },
      "--env": {
        key: "environmentId",
        type: "single",
        required: true,
        description: "Deploy comment must include --env <environment>",
      },
    },
  });

  if (!parsedCommand.matched) {
    return { matched: false };
  }

  const { all, applicationSelector, environmentId } = parsedCommand.values;
  if (!all && !applicationSelector) {
    throw new Error('Deploy comment must include --name "<Application Name>" or --all');
  }

  return {
    matched: true,
    values: {
      applicationSelector: all ? "all" : applicationSelector,
      environmentId,
    },
  };
};

export { repoRoot };
