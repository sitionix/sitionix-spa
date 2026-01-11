import { defineConfig } from "vite";
import type { Plugin, UserConfig } from "vite";

export type CreateViteConfigOptions = {
  root?: string;
  plugins?: Plugin[];
  aliases?: Record<string, string>;
  optimizeDepsExclude?: string[];
  server?: UserConfig["server"];
  preview?: UserConfig["preview"];
  build?: UserConfig["build"];
};

export function createViteConfig({
  root,
  plugins = [],
  aliases = {},
  optimizeDepsExclude = [],
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
