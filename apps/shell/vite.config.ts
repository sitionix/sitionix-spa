import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

const fullReloadOnRemoteChange = (): Plugin => ({
  name: "full-reload-on-remote-change",
  configureServer(server) {
    const authSrc = path.resolve(__dirname, "../auth/src");
    const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
    const watchPaths = [authSrc, uiSrc];

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
  const authRemote = isDev
    ? "http://localhost:3001/remoteEntry.js"
    : "http://localhost:3001/assets/remoteEntry.js";

  return {
    plugins: [
      react(),
      ...(isDev ? [fullReloadOnRemoteChange()] : []),
      federation({
        name: "shell",
        remotes: {
          auth: authRemote,
        },
        shared: ["react", "react-dom", "react-router-dom"],
      }),
    ],
    server: { port: 3000, strictPort: true, host: "127.0.0.1" },
    build: { target: "esnext" },
  };
});
