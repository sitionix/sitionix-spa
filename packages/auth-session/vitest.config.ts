import path from "node:path";
import { defineConfig } from "vitest/config";

const cacheDir = path.resolve(__dirname, "..", "..", ".cache", "vitest-auth-session");

export default defineConfig({
  cacheDir,
  test: {
    environment: "jsdom",
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/__tests__/**", "src/**/*.d.ts"],
    },
  },
});
