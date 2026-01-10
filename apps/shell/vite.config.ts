import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve" && mode === "development";
  const authRemote = isDev
    ? "http://localhost:3001/remoteEntry.js"
    : "http://localhost:3001/assets/remoteEntry.js";

  return {
    plugins: [
      react(),
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
