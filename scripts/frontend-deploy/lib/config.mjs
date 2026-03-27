import fs from "node:fs";
import path from "node:path";
import { parseNamedCommand } from "./cli.mjs";
import { deployConfigRoot, deployEnvironmentsRoot, repoRoot } from "./paths.mjs";

const loadJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

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

  for (const environment of catalog.environments) {
    for (const application of catalog.applications) {
      if (!environment.hosts[application.id]) {
        throw new Error(`Missing host for ${application.id} in environment ${environment.id}`);
      }

      if (!environment.ssl[application.id]) {
        throw new Error(`Missing SSL config for ${application.id} in environment ${environment.id}`);
      }
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
