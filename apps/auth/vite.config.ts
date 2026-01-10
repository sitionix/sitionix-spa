import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

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
  server: { port: 3001, strictPort: true, host: "127.0.0.1" },
  build: { target: "esnext" },
});
