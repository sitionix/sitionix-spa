import { defineConfig } from "vite";
import type { Plugin, UserConfig } from "vite";

export type CreateViteConfigOptions = {
  root?: string;
  plugins?: Plugin[];
  aliases?: Record<string, string>;
  optimizeDepsExclude?: string[];
  cacheDir?: string;
  server?: UserConfig["server"];
  preview?: UserConfig["preview"];
  build?: UserConfig["build"];
};

export function createViteConfig({
  root,
  plugins = [],
  aliases = {},
  optimizeDepsExclude = [],
  cacheDir,
  server,
  preview,
  build,
}: CreateViteConfigOptions): UserConfig {
  const buildOptions = {
    target: "esnext",
    ...(build ?? {}),
  };

  return defineConfig({
    root,
    plugins,
    resolve: {
      alias: aliases,
    },
    cacheDir,
    optimizeDeps: optimizeDepsExclude.length
      ? {
          exclude: optimizeDepsExclude,
        }
      : undefined,
    server,
    preview,
    build: buildOptions,
  });
}
