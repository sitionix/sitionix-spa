import path from "node:path";
import { defineConfig } from "vitest/config";

const cacheDir = path.resolve(
  __dirname,
  "..",
  "..",
  ".cache",
  "vitest-tailwind-config"
);

export default defineConfig({
  cacheDir,
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      all: true,
      include: ["preset.ts"],
      exclude: ["__tests__/**"],
    },
  },
});
