import fs from "node:fs";
import path from "node:path";
import { parseCliArgs } from "./lib/cli.mjs";
import { renderNginxConfig } from "./lib/nginx.mjs";
import { readDeploymentPlan } from "./lib/plan.mjs";
import { repoRoot } from "./lib/config.mjs";

const cli = parseCliArgs(process.argv.slice(2), {
  "--plan-file": {
    key: "planFile",
    type: "single",
    required: true,
    description: "prepare-release requires --plan-file <path>",
  },
  "--output-dir": {
    key: "outputDir",
    type: "single",
    required: true,
    description: "prepare-release requires --output-dir <path>",
  },
  "--release-id": {
    key: "releaseId",
    type: "single",
    required: true,
    description: "prepare-release requires --release-id <value>",
  },
});

const plan = readDeploymentPlan(cli.planFile);
const selectedApplications = plan.selectedApplications;

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

  if (application.shellApplication) {
    const requiredRemotes = plan.applications
      .filter((candidate) => candidate.expectsRemoteEntry)
      .map((candidate) => `${candidate.publicUrl}${candidate.remoteEntryPath}`);
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

  if (application.expectsRemoteEntry && !bundleText.includes(plan.environment.shellOrigin)) {
    throw new Error(
      `${application.id} bundle does not contain expected shell origin ${plan.environment.shellOrigin}`
    );
  }
};

for (const application of selectedApplications) {
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

fs.writeFileSync(
  path.resolve(nginxRoot, "sitionix-frontend.conf"),
  renderNginxConfig(plan),
  "utf8"
);

fs.cpSync(
  path.resolve(repoRoot, "deploy/frontend/vm/deploy-frontend.sh"),
  path.resolve(binRoot, "deploy-frontend.sh")
);

const shellQuote = (value) => `'${String(value).replace(/'/gu, `'\\''`)}'`;
const releaseEnv = {
  SITIONIX_RELEASE_ID: cli.releaseId,
  SITIONIX_DEPLOY_ENV: plan.environment.id,
  SITIONIX_SELECTED_APPS: selectedApplications.map((application) => application.id).join(","),
  SITIONIX_REMOTE_ENTRY_APPS: selectedApplications
    .filter((application) => application.expectsRemoteEntry)
    .map((application) => application.id)
    .join(","),
  SITIONIX_APP_ROOT: plan.environment.vm.appRoot,
  SITIONIX_RUNTIME_ROOT: plan.environment.vm.runtimeRoot,
  SITIONIX_BACKUP_ROOT: plan.environment.vm.backupRoot,
  SITIONIX_NGINX_SITE_PATH: plan.environment.vm.nginxSitePath,
  SITIONIX_NGINX_SITE_LINK_PATH: plan.environment.vm.nginxSiteLinkPath,
  SITIONIX_SUDO_COMMAND: plan.environment.vm.sudoCommand,
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
      environment: plan.environment.id,
      applications: selectedApplications.map((application) => ({
        id: application.id,
        name: application.name,
        publicUrl: application.publicUrl,
      })),
      buildEnv: plan.environment.buildEnv,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  ),
  "utf8"
);

fs.writeFileSync(
  path.resolve(payloadRoot, "deployment-plan.json"),
  JSON.stringify(plan, null, 2),
  "utf8"
);
