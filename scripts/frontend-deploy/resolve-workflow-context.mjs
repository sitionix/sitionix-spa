import {
  buildDeploymentPlan,
  getEnvironmentByBranch,
  getEnvironmentById,
  loadDeploymentCatalog,
  parseDeployComment,
  selectApplications,
} from "./lib/config.mjs";

const catalog = loadDeploymentCatalog();
const eventName = process.env.DEPLOY_EVENT_NAME;

const writeOutput = (key, value) => {
  console.log(`${key}=${value}`);
};

const disableWorkflow = (reason) => {
  writeOutput("enabled", "false");
  writeOutput("reason", reason);
};

try {
  let environment;
  let applications;
  let triggerKind = eventName;

  if (eventName === "push") {
    environment = getEnvironmentByBranch(catalog, process.env.DEPLOY_REF_NAME ?? "");
    if (!environment) {
      disableWorkflow(`No deployment environment is mapped to branch ${process.env.DEPLOY_REF_NAME}`);
      process.exit(0);
    }
    applications = selectApplications(catalog, "all");
  } else if (eventName === "workflow_dispatch") {
    environment = getEnvironmentById(catalog, process.env.DEPLOY_INPUT_ENV ?? "");
    applications = selectApplications(catalog, process.env.DEPLOY_INPUT_APP ?? "all");
  } else if (eventName === "issue_comment") {
    if (process.env.DEPLOY_IS_PULL_REQUEST !== "true") {
      disableWorkflow("Comment deploy is supported only on pull requests");
      process.exit(0);
    }

    const parsedComment = parseDeployComment(catalog, process.env.DEPLOY_COMMENT_BODY ?? "");
    if (!parsedComment.matched) {
      disableWorkflow("Comment does not match deployment command");
      process.exit(0);
    }

    environment = getEnvironmentById(catalog, parsedComment.values.environmentId);
    applications = selectApplications(catalog, parsedComment.values.applicationSelector);
    triggerKind = "pull_request_comment";
  } else {
    disableWorkflow(`Unsupported event ${eventName}`);
    process.exit(0);
  }

  const plan = buildDeploymentPlan({
    catalog,
    triggerKind,
    environment,
    applications,
  });

  writeOutput("enabled", "true");
  writeOutput("github_environment", plan.environment.githubEnvironment);
  writeOutput("deploy_summary", plan.summary);
  writeOutput("deployment_plan", JSON.stringify(plan));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
