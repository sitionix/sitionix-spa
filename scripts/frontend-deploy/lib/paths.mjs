import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../../..");
export const deployFrontendRoot = path.resolve(repoRoot, "deploy/frontend");
export const deployConfigRoot = path.resolve(deployFrontendRoot, "config");
export const deployEnvironmentsRoot = path.resolve(deployFrontendRoot, "environments");
