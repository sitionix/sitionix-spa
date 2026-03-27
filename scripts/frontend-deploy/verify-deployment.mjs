import { parseCliArgs } from "./lib/cli.mjs";
import { readDeploymentPlan } from "./lib/plan.mjs";

const cli = parseCliArgs(process.argv.slice(2), {
  "--plan-file": {
    key: "planFile",
    type: "single",
    required: true,
    description: "verify-deployment requires --plan-file <path>",
  },
});

const plan = readDeploymentPlan(cli.planFile);

const assertOk = async (url) => {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Public URL check failed for ${url}: ${response.status}`);
  }
};

const assertRemoteEntry = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/javascript,text/javascript,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Remote entry check failed for ${url}: ${response.status}`);
  }

  const allowOrigin = response.headers.get("access-control-allow-origin");
  if (allowOrigin !== plan.environment.shellOrigin) {
    throw new Error(
      `Remote entry ${url} returned unexpected Access-Control-Allow-Origin ${allowOrigin}`
    );
  }
};

const assertShellProxy = async (url) => {
  const response = await fetch(url, {
    method: "POST",
    redirect: "manual",
  });

  if (response.status >= 500) {
    throw new Error(`Shell BFF proxy check failed for ${url}: ${response.status}`);
  }
};

for (const publicUrl of plan.verification.publicUrls) {
  await assertOk(publicUrl);
}

for (const remoteEntryUrl of plan.verification.remoteEntryUrls) {
  await assertRemoteEntry(remoteEntryUrl);
}

await assertShellProxy(plan.verification.shellProxyUrl);
