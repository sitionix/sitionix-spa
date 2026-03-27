import { parseCliArgs } from "./lib/cli.mjs";
import { readDeploymentPlan } from "./lib/plan.mjs";
import { runCommand } from "./lib/process.mjs";

const cli = parseCliArgs(process.argv.slice(2), {
  "--plan-file": {
    key: "planFile",
    type: "single",
    required: true,
    description: "build-applications requires --plan-file <path>",
  },
});

const plan = readDeploymentPlan(cli.planFile);
const packageFilters = plan.selectedApplications.flatMap((application) => [
  "--filter",
  application.package,
]);

runCommand({
  command: "pnpm",
  args: ["--filter", "@sitionix/build-config", "build"],
  env: plan.environment.buildEnv,
});

runCommand({
  command: "pnpm",
  args: [...packageFilters, "build"],
  env: plan.environment.buildEnv,
});
