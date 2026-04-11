import path from "node:path";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import federation from "@originjs/vite-plugin-federation";
import { createViteConfig } from "@sitionix/build-config";

const workspaceRoot = path.resolve(__dirname, "../..");
const cacheDir = path.resolve(workspaceRoot, ".cache", "vite-builder");
const uiSrc = path.resolve(__dirname, "../../packages/ui/src");
const sharedCertDir = path.resolve(workspaceRoot, ".cache", "vite-shared-ssl");

const assetsRemoteEntryCompat = (): Plugin => ({
  name: "builder-assets-remote-entry-compat",
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
    basicSsl({ certDir: sharedCertDir, name: "sitionix-local" }),
    react(),
    assetsRemoteEntryCompat(),
    federation({
      name: "builder",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mf/mount.tsx",
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
        "react-router-dom": {
          packagePath: "react-router-dom",
        },
      },
    }),
  ],
  aliases: {
    "@sitionix/ui": uiSrc,
  },
  optimizeDepsExclude: ["@sitionix/ui"],
  server: {
    port: 3003,
    strictPort: true,
    host: process.env.VITE_HOST ?? "127.0.0.1",
    https: true,
    fs: { allow: [workspaceRoot] },
  },
  preview: { port: 3003, strictPort: true, host: "0.0.0.0", https: true, cors: true },
});
