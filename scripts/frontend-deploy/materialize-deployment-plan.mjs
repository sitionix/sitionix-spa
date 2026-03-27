import fs from "node:fs";
import { parseCliArgs } from "./lib/cli.mjs";
import {
  buildDeploymentPlan,
  getApplicationById,
  getEnvironmentById,
  loadDeploymentCatalog,
  materializeDeploymentEnvironment,
} from "./lib/config.mjs";

const cli = parseCliArgs(process.argv.slice(2), {
  "--request-file": {
    key: "requestFile",
    type: "single",
    required: true,
    description: "materialize-deployment-plan requires --request-file <path>",
  },
  "--output-file": {
    key: "outputFile",
    type: "single",
    required: true,
    description: "materialize-deployment-plan requires --output-file <path>",
  },
});

const request = JSON.parse(fs.readFileSync(cli.requestFile, "utf8"));
const catalog = loadDeploymentCatalog();
const environment = getEnvironmentById(catalog, request.environmentId);
const applications = request.selectedApplicationIds.map((applicationId) =>
  getApplicationById(catalog, applicationId)
);

const plan = buildDeploymentPlan({
  catalog,
  triggerKind: request.triggerKind,
  environment: materializeDeploymentEnvironment({
    catalog,
    environment,
    env: process.env,
  }),
  applications,
});

fs.writeFileSync(cli.outputFile, JSON.stringify(plan, null, 2), "utf8");
