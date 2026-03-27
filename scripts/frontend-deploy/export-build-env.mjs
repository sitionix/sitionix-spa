import { getBuildEnvironmentVariables, getEnvironmentById, loadDeploymentConfig } from "./lib/config.mjs";

const args = process.argv.slice(2);
let environmentId = "";

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--env") {
    environmentId = args[index + 1];
    index += 1;
  }
}

if (!environmentId) {
  throw new Error("export-build-env requires --env <environment>");
}

const config = loadDeploymentConfig();
const environment = getEnvironmentById(config, environmentId);
const buildEnv = getBuildEnvironmentVariables(environment);

for (const [key, value] of Object.entries(buildEnv)) {
  console.log(`${key}=${value}`);
}
