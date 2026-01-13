import path from "node:path";
import react from "@vitejs/plugin-react";
import { createVitestConfig } from "@sitionix/build-config";

const workspaceRoot = path.resolve(__dirname, "../..");
const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
const authSessionSrc = path.resolve(__dirname, "../../packages/auth-session/src");
const httpClientSrc = path.resolve(__dirname, "../../packages/http-client/src");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vitest-auth");

export default createVitestConfig({
  root: __dirname,
  plugins: [react()],
  cacheDir,
  aliases: {
    "@sitionix/ui": uiSrc,
    "@sitionix/auth-session": authSessionSrc,
    "@sitionix/http-client": httpClientSrc,
  },
  environment: "jsdom",
  setupFiles: ["./src/test/setupTests.ts"],
  env: {
    VITE_API_BASE_URL: "http://localhost",
  },
  include: [
    "src/__tests__/**/*.test.ts",
    "src/__tests__/**/*.test.tsx",
    "src/__tests__/**/*.int.test.tsx",
  ],
  coverage: {
    provider: "v8",
    reporter: ["text", "lcov", "html"],
    all: true,
    include: ["src/**/*.{ts,tsx}"],
    exclude: [
      "src/__tests__/**",
      "src/test/**",
      "src/**/*.d.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.int.test.tsx",
      "src/**/model/*Context.ts",
      "src/**/model/*Types.ts",
      "src/**/model/*Handlers.ts",
    ],
    lines: 95,
    functions: 95,
    statements: 95,
    branches: 85,
  },
});
