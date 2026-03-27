import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import federation from "@originjs/vite-plugin-federation";
import { resolveFederationRemotes } from "./src/config/resolveFederationRemotes";

const workspaceRoot = path.resolve(__dirname, "../..");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vite-shell");
const sharedCertDir = path.resolve(workspaceRoot, ".cache", "vite-shared-ssl");
const authSessionSrc = path.resolve(
  __dirname,
  "../../packages/auth-session/src"
);

const fullReloadOnRemoteChange = (): Plugin => ({
  name: "full-reload-on-remote-change",
  configureServer(server) {
    const authSrc = path.resolve(__dirname, "../auth/src");
    const workspaceSrc = path.resolve(__dirname, "../workspace/src");
    const builderSrc = path.resolve(__dirname, "../builder/src");
    const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
    const watchPaths = [authSrc, workspaceSrc, builderSrc, uiSrc];

    server.watcher.add(watchPaths);
    const triggerReload = (file: string) => {
      if (!watchPaths.some((watchPath) => file.startsWith(watchPath))) {
        return;
      }
      server.ws.send({ type: "full-reload", path: "*" });
    };

    server.watcher.on("add", triggerReload);
    server.watcher.on("change", triggerReload);
    server.watcher.on("unlink", triggerReload);
  },
});

export default defineConfig(({ command, mode }) => {
  const viteEnv = loadEnv(mode, __dirname, "");
  const resolvedEnv = {
    ...viteEnv,
    ...process.env,
  };
  const isDev = command === "serve" && mode === "development";
  const host = resolvedEnv.VITE_HOST ?? "127.0.0.1";
  const bffProxyTarget = resolvedEnv.VITE_BFF_PROXY_TARGET ?? "http://localhost:8080";
  const remotes = resolveFederationRemotes({ isDev, env: resolvedEnv });

  return {
    cacheDir,
    resolve: {
      alias: {
        "@sitionix/auth-session": authSessionSrc,
      },
    },
    optimizeDeps: {
      exclude: ["@sitionix/auth-session"],
    },
    plugins: [
      react(),
      basicSsl({ certDir: sharedCertDir, name: "sitionix-local" }),
      ...(isDev ? [fullReloadOnRemoteChange()] : []),
      federation({
        name: "shell",
        remotes,
        shared: {
          react: { packagePath: "react" },
          "react/jsx-runtime": {
            packagePath: "react/jsx-runtime",
            version: "18.3.1",
          },
          "react/jsx-dev-runtime": {
            packagePath: "react/jsx-dev-runtime",
            version: "18.3.1",
          },
          "react-dom": { packagePath: "react-dom" },
          "react-dom/client": {
            packagePath: "react-dom/client",
            version: "18.3.1",
          },
          "react-router-dom": { packagePath: "react-router-dom" },
        },
      }),
    ],
    server: {
      port: 3000,
      strictPort: true,
      host,
      https: true,
      proxy: {
        "/bffssox": {
          target: bffProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      fs: { allow: [workspaceRoot] },
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0",
      https: true,
      proxy: {
        "/bffssox": {
          target: bffProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: { target: "esnext" },
  };
});
