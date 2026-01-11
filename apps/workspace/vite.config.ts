import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

const assetsRemoteEntryCompat = (): Plugin => ({
  name: "workspace-assets-remote-entry-compat",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/assets/remoteEntry.js") {
        next();
        return;
      }
      try {
        const result = await server.transformRequest("/remoteEntry.js");
        if (!result?.code) {
          next();
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript");
        res.end(result.code);
      } catch {
        next();
      }
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    assetsRemoteEntryCompat(),
    federation({
      name: "workspace",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mf/mount.tsx",
      },
      shared: {
        react: { import: false, generate: false, packagePath: "react" },
        "react/jsx-runtime": {
          import: false,
          generate: false,
          packagePath: "react/jsx-runtime",
          version: "18.3.1",
        },
        "react/jsx-dev-runtime": {
          import: false,
          generate: false,
          packagePath: "react/jsx-dev-runtime",
          version: "18.3.1",
        },
        "react-dom": { import: false, generate: false, packagePath: "react-dom" },
        "react-dom/client": {
          import: false,
          generate: false,
          packagePath: "react-dom/client",
          version: "18.3.1",
        },
        "react-router-dom": {
          import: false,
          generate: false,
          packagePath: "react-router-dom",
        },
      },
    }),
  ],
  server: { port: 3002, strictPort: true, host: "127.0.0.1" },
  preview: { port: 3002, strictPort: true, host: "0.0.0.0", cors: true },
  build: { target: "esnext" },
});
