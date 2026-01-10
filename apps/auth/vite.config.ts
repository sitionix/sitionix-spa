import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

const uiSrc = path.resolve(__dirname, "../../packages/ui/src");

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "auth",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mf/mount.tsx",
      },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@sitionix/ui": uiSrc,
    },
  },
  optimizeDeps: {
    exclude: ["@sitionix/ui"],
  },
  server: {
    port: 3001,
    strictPort: true,
    host: "127.0.0.1",
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
  build: { target: "esnext" },
});
