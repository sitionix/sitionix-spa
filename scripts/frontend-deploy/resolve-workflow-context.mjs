import {
  getEnvironmentByBranch,
  getEnvironmentById,
  getPublicUrlsForVerification,
  getRemoteEntryUrlsForVerification,
  loadDeploymentConfig,
  parseDeployComment,
  selectApplications,
} from "./lib/config.mjs";

const config = loadDeploymentConfig();
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
    environment = getEnvironmentByBranch(config, process.env.DEPLOY_REF_NAME ?? "");
    if (!environment) {
      disableWorkflow(`No deployment environment is mapped to branch ${process.env.DEPLOY_REF_NAME}`);
      process.exit(0);
    }
    applications = selectApplications(config, "all");
  } else if (eventName === "workflow_dispatch") {
    environment = getEnvironmentById(config, process.env.DEPLOY_INPUT_ENV ?? "");
    applications = selectApplications(config, process.env.DEPLOY_INPUT_APP ?? "all");
  } else if (eventName === "issue_comment") {
    if (process.env.DEPLOY_IS_PULL_REQUEST !== "true") {
      disableWorkflow("Comment deploy is supported only on pull requests");
      process.exit(0);
    }

    const parsedComment = parseDeployComment(config, process.env.DEPLOY_COMMENT_BODY ?? "");
    if (!parsedComment.matched) {
      disableWorkflow("Comment does not match deployment command");
      process.exit(0);
    }

    environment = getEnvironmentById(config, parsedComment.environmentId);
    applications = selectApplications(config, parsedComment.applicationSelector);
    triggerKind = "pull_request_comment";
  } else {
    disableWorkflow(`Unsupported event ${eventName}`);
    process.exit(0);
  }

  const publicUrls = getPublicUrlsForVerification(applications, environment);
  const remoteEntryUrls = getRemoteEntryUrlsForVerification(applications, environment);

  writeOutput("enabled", "true");
  writeOutput("trigger_kind", triggerKind);
  writeOutput("environment_id", environment.id);
  writeOutput("github_environment", environment.githubEnvironment ?? environment.id);
  writeOutput("application_ids", applications.map((application) => application.id).join(","));
  writeOutput("application_names", applications.map((application) => application.name).join(","));
  writeOutput("package_filters", applications.map((application) => application.package).join(","));
  writeOutput("public_urls", publicUrls.join(","));
  writeOutput("remote_entry_urls", remoteEntryUrls.join(","));
  writeOutput(
    "deploy_summary",
    `${applications.map((application) => application.name).join(", ")} -> ${environment.id}`
  );
  writeOutput("command_prefix", config.deploymentCommand.prefix);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
