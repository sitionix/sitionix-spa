import fs from "node:fs";

export const writeDeploymentPlan = (planPath, plan) => {
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), "utf8");
};

export const readDeploymentPlan = (planPath) =>
  JSON.parse(fs.readFileSync(planPath, "utf8"));
