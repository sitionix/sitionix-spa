import path from "node:path";
import react from "@vitejs/plugin-react";
import { createVitestConfig } from "@sitionix/build-config";

const workspaceRoot = path.resolve(__dirname, "../..");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vitest-shell");

export default createVitestConfig({
  root: __dirname,
  plugins: [react()],
  cacheDir,
  environment: "jsdom",
  setupFiles: ["./src/test/setupTests.ts"],
  include: ["src/__tests__/**/*.test.tsx", "src/__tests__/**/*.test.ts"],
  coverage: {
    provider: "v8",
    reporter: ["text", "lcov", "html"],
    all: true,
    include: ["src/**/*.{ts,tsx}"],
    exclude: ["src/__tests__/**", "src/test/**", "src/**/*.d.ts"],
  },
});
