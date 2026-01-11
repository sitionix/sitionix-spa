import { defineConfig } from "vitest/config";
import type { UserConfig } from "vite";
import type { Plugin } from "vite";

export type CreateVitestConfigOptions = {
  root?: string;
  plugins?: Plugin[];
  aliases?: Record<string, string>;
  environment?: NonNullable<UserConfig["test"]>["environment"];
  globals?: NonNullable<UserConfig["test"]>["globals"];
  setupFiles?: string[];
  env?: Record<string, string>;
  include?: string[];
  coverage?: NonNullable<UserConfig["test"]>["coverage"];
};

export function createVitestConfig({
  root,
  plugins = [],
  aliases = {},
  environment,
  globals,
  setupFiles,
  env,
  include,
  coverage,
}: CreateVitestConfigOptions): UserConfig {
  return defineConfig({
    root,
    plugins,
    resolve: {
      alias: aliases,
    },
    test: {
      environment,
      globals,
      setupFiles,
      env,
      include,
      coverage,
    },
  });
}
