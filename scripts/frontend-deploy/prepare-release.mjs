import fs from "node:fs";
import path from "node:path";
import {
  getApplicationById,
  getBuildEnvironmentVariables,
  getEnvironmentById,
  getOrigins,
  loadDeploymentConfig,
  repoRoot,
} from "./lib/config.mjs";

const args = process.argv.slice(2);
const cli = {
  environmentId: "",
  applicationIds: [],
  outputDir: "",
  releaseId: "",
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  const value = args[index + 1];

  if (arg === "--env") {
    cli.environmentId = value;
    index += 1;
    continue;
  }

  if (arg === "--app") {
    cli.applicationIds.push(value);
    index += 1;
    continue;
  }

  if (arg === "--output-dir") {
    cli.outputDir = value;
    index += 1;
    continue;
  }

  if (arg === "--release-id") {
    cli.releaseId = value;
    index += 1;
    continue;
  }

  throw new Error(`Unsupported argument: ${arg}`);
}

if (!cli.environmentId || !cli.outputDir || !cli.releaseId || !cli.applicationIds.length) {
  throw new Error(
    "prepare-release requires --env, at least one --app, --output-dir and --release-id"
  );
}

const config = loadDeploymentConfig();
const environment = getEnvironmentById(config, cli.environmentId);
const applications = cli.applicationIds.map((applicationId) =>
  getApplicationById(config, applicationId)
);
const origins = getOrigins(environment);
const buildEnv = getBuildEnvironmentVariables(environment);

const payloadRoot = path.resolve(cli.outputDir, "payload");
const appsRoot = path.resolve(payloadRoot, "apps");
const nginxRoot = path.resolve(payloadRoot, "nginx");
const binRoot = path.resolve(payloadRoot, "bin");

fs.rmSync(cli.outputDir, { recursive: true, force: true });
fs.mkdirSync(appsRoot, { recursive: true });
fs.mkdirSync(nginxRoot, { recursive: true });
fs.mkdirSync(binRoot, { recursive: true });

const collectTextFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTextFiles(fullPath);
    }
    if (!/\.(?:html|js|mjs|css|map|txt)$/u.test(entry.name)) {
      return [];
    }
    return [fullPath];
  });
};

const readBundleText = (directory) =>
  collectTextFiles(directory)
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");

const assertArtifactShape = (application, distDirectory) => {
  if (!fs.existsSync(path.resolve(distDirectory, "index.html"))) {
    throw new Error(`Missing index.html for ${application.id} at ${distDirectory}`);
  }

  if (
    application.expectsRemoteEntry &&
    !fs.existsSync(path.resolve(distDirectory, "assets/remoteEntry.js")) &&
    !fs.existsSync(path.resolve(distDirectory, "remoteEntry.js"))
  ) {
    throw new Error(`Missing remoteEntry.js for ${application.id} at ${distDirectory}`);
  }
};

const assertBundleContent = (application, distDirectory) => {
  const bundleText = readBundleText(distDirectory);

  if (application.id === "shell") {
    const requiredRemotes = [
      `${origins.auth}/assets/remoteEntry.js`,
      `${origins.workspace}/assets/remoteEntry.js`,
      `${origins.builder}/assets/remoteEntry.js`,
    ];
    for (const requiredRemote of requiredRemotes) {
      if (!bundleText.includes(requiredRemote)) {
        throw new Error(`Shell bundle does not contain expected remote ${requiredRemote}`);
      }
    }
    if (/localhost:\d+/u.test(bundleText)) {
      throw new Error("Shell bundle still contains localhost remote references");
    }
    return;
  }

  if (application.expectsRemoteEntry && !bundleText.includes(origins.shell)) {
    throw new Error(`${application.id} bundle does not contain expected shell origin ${origins.shell}`);
  }
};

for (const application of applications) {
  const distDirectory = path.resolve(repoRoot, application.distPath);
  if (!fs.existsSync(distDirectory)) {
    throw new Error(`Build output not found for ${application.id}: ${distDirectory}`);
  }

  assertArtifactShape(application, distDirectory);
  assertBundleContent(application, distDirectory);

  fs.cpSync(distDirectory, path.resolve(appsRoot, application.deploySubdirectory), {
    recursive: true,
  });
}

const nginxTemplatePath = path.resolve(
  repoRoot,
  "deploy/frontend/nginx/sitionix-frontend.conf.template"
);
const nginxTemplate = fs.readFileSync(nginxTemplatePath, "utf8");

const replaceToken = (template, token, value) => template.replaceAll(`__${token}__`, value);

let nginxConfig = nginxTemplate;
nginxConfig = replaceToken(nginxConfig, "SHELL_SERVER_NAME", environment.hosts.shell);
nginxConfig = replaceToken(nginxConfig, "AUTH_SERVER_NAME", environment.hosts.auth);
nginxConfig = replaceToken(nginxConfig, "WORKSPACE_SERVER_NAME", environment.hosts.workspace);
nginxConfig = replaceToken(nginxConfig, "BUILDER_SERVER_NAME", environment.hosts.builder);
nginxConfig = replaceToken(
  nginxConfig,
  "SHELL_ROOT",
  path.posix.join(environment.vm.appRoot, "current", "shell")
);
nginxConfig = replaceToken(
  nginxConfig,
  "AUTH_ROOT",
  path.posix.join(environment.vm.appRoot, "current", "auth")
);
nginxConfig = replaceToken(
  nginxConfig,
  "WORKSPACE_ROOT",
  path.posix.join(environment.vm.appRoot, "current", "workspace")
);
nginxConfig = replaceToken(
  nginxConfig,
  "BUILDER_ROOT",
  path.posix.join(environment.vm.appRoot, "current", "builder")
);
nginxConfig = replaceToken(nginxConfig, "BFF_PROXY_TARGET", environment.bff.proxyTarget);
nginxConfig = replaceToken(nginxConfig, "SHELL_ORIGIN", origins.shell);
nginxConfig = replaceToken(
  nginxConfig,
  "SHELL_CERTIFICATE_PATH",
  environment.ssl.shell.certificatePath
);
nginxConfig = replaceToken(
  nginxConfig,
  "SHELL_CERTIFICATE_KEY_PATH",
  environment.ssl.shell.certificateKeyPath
);
nginxConfig = replaceToken(
  nginxConfig,
  "AUTH_CERTIFICATE_PATH",
  environment.ssl.auth.certificatePath
);
nginxConfig = replaceToken(
  nginxConfig,
  "AUTH_CERTIFICATE_KEY_PATH",
  environment.ssl.auth.certificateKeyPath
);
nginxConfig = replaceToken(
  nginxConfig,
  "WORKSPACE_CERTIFICATE_PATH",
  environment.ssl.workspace.certificatePath
);
nginxConfig = replaceToken(
  nginxConfig,
  "WORKSPACE_CERTIFICATE_KEY_PATH",
  environment.ssl.workspace.certificateKeyPath
);
nginxConfig = replaceToken(
  nginxConfig,
  "BUILDER_CERTIFICATE_PATH",
  environment.ssl.builder.certificatePath
);
nginxConfig = replaceToken(
  nginxConfig,
  "BUILDER_CERTIFICATE_KEY_PATH",
  environment.ssl.builder.certificateKeyPath
);

fs.writeFileSync(
  path.resolve(nginxRoot, "sitionix-frontend.conf"),
  nginxConfig,
  "utf8"
);

fs.cpSync(
  path.resolve(repoRoot, "deploy/frontend/vm/deploy-frontend.sh"),
  path.resolve(binRoot, "deploy-frontend.sh")
);

const shellQuote = (value) => `'${String(value).replace(/'/gu, `'\\''`)}'`;
const releaseEnv = {
  SITIONIX_RELEASE_ID: cli.releaseId,
  SITIONIX_DEPLOY_ENV: environment.id,
  SITIONIX_SELECTED_APPS: applications.map((application) => application.id).join(","),
  SITIONIX_REMOTE_ENTRY_APPS: applications
    .filter((application) => application.expectsRemoteEntry)
    .map((application) => application.id)
    .join(","),
  SITIONIX_APP_ROOT: environment.vm.appRoot,
  SITIONIX_RUNTIME_ROOT: environment.vm.runtimeRoot,
  SITIONIX_BACKUP_ROOT: environment.vm.backupRoot,
  SITIONIX_NGINX_SITE_PATH: environment.vm.nginxSitePath,
  SITIONIX_NGINX_SITE_LINK_PATH: environment.vm.nginxSiteLinkPath,
  SITIONIX_SUDO_COMMAND: environment.vm.sudoCommand,
  SITIONIX_SHELL_ORIGIN: origins.shell,
  SITIONIX_AUTH_ORIGIN: origins.auth,
  SITIONIX_WORKSPACE_ORIGIN: origins.workspace,
  SITIONIX_BUILDER_ORIGIN: origins.builder,
  SITIONIX_BFF_PROXY_TARGET: environment.bff.proxyTarget,
};

fs.writeFileSync(
  path.resolve(payloadRoot, "release.env"),
  Object.entries(releaseEnv)
    .map(([key, value]) => `${key}=${shellQuote(value)}`)
    .join("\n")
    .concat("\n"),
  "utf8"
);

fs.writeFileSync(
  path.resolve(payloadRoot, "release-manifest.json"),
  JSON.stringify(
    {
      releaseId: cli.releaseId,
      environment: environment.id,
      applications: applications.map((application) => ({
        id: application.id,
        name: application.name,
        publicUrl: origins[application.hostKey],
      })),
      buildEnv,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  ),
  "utf8"
);
