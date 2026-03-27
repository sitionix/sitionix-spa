import { spawnSync } from "node:child_process";

export const runCommand = ({ command, args, env }) => {
  const result = spawnSync(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });

  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }

  if (result.error) {
    throw result.error;
  }
};
