import path from "node:path";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { createViteConfig } from "@sitionix/build-config";

const workspaceRoot = path.resolve(__dirname, "../..");
const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
const authSessionSrc = path.resolve(__dirname, "../../packages/auth-session/src");
const httpClientSrc = path.resolve(__dirname, "../../packages/http-client/src");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vite-auth");

const assetsRemoteEntryCompat = (): Plugin => ({
  name: "auth-assets-remote-entry-compat",
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

export default createViteConfig({
  root: __dirname,
  cacheDir,
  plugins: [
    react(),
    assetsRemoteEntryCompat(),
    federation({
      name: "auth",
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
  aliases: {
    "@sitionix/ui": uiSrc,
    "@sitionix/auth-session": authSessionSrc,
    "@sitionix/http-client": httpClientSrc,
  },
  optimizeDepsExclude: [
    "@sitionix/ui",
    "@sitionix/auth-session",
    "@sitionix/http-client",
  ],
  server: {
    port: 3001,
    strictPort: true,
    host: process.env.VITE_HOST ?? "127.0.0.1",
    fs: {
      allow: [workspaceRoot],
    },
  },
  preview: {
    port: 3001,
    strictPort: true,
    host: "0.0.0.0",
    cors: true,
  },
});
