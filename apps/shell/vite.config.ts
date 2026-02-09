import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

const workspaceRoot = path.resolve(__dirname, "../..");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vite-shell");

const fullReloadOnRemoteChange = (): Plugin => ({
  name: "full-reload-on-remote-change",
  configureServer(server) {
    const authSrc = path.resolve(__dirname, "../auth/src");
    const workspaceSrc = path.resolve(__dirname, "../workspace/src");
    const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
    const watchPaths = [authSrc, workspaceSrc, uiSrc];

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
  const isDev = command === "serve" && mode === "development";
  const host = process.env.VITE_HOST ?? "127.0.0.1";
  const authRemote = isDev
    ? "http://localhost:3001/remoteEntry.js"
    : "http://localhost:3001/assets/remoteEntry.js";
  const workspaceRemote = isDev
    ? "http://localhost:3002/remoteEntry.js"
    : "http://localhost:3002/assets/remoteEntry.js";

  return {
    cacheDir,
    plugins: [
      react(),
      ...(isDev ? [fullReloadOnRemoteChange()] : []),
      federation({
        name: "shell",
        remotes: {
          auth: authRemote,
          workspace: workspaceRemote,
        },
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
      fs: { allow: [workspaceRoot] },
    },
    preview: { port: 3000, strictPort: true, host: "0.0.0.0" },
    build: { target: "esnext" },
  };
});
