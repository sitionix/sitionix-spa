import path from "node:path";
import react from "@vitejs/plugin-react";
import { createVitestConfig } from "@sitionix/build-config";

const workspaceRoot = path.resolve(__dirname, "../..");
const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vitest-builder");

export default createVitestConfig({
  root: __dirname,
  plugins: [react()],
  cacheDir,
  aliases: {
    "@sitionix/ui": uiSrc,
  },
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/test/setupTests.ts"],
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
    lines: 90,
    functions: 90,
    statements: 90,
    branches: 80,
  },
});
