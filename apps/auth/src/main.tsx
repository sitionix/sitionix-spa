import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./style.css";
import { App } from "./app/App";

const redirectStandaloneToShell = (): boolean => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return false;
  }

  const userAgent = browserWindow.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom")) {
    return false;
  }

  const shellOrigin = (import.meta.env.VITE_SHELL_ORIGIN as string | undefined)?.trim();
  if (!shellOrigin) {
    throw new Error("Missing required env variable: VITE_SHELL_ORIGIN");
  }

  if (browserWindow.location.origin === shellOrigin) {
    return false;
  }

  const pathWithoutAuthPrefix = browserWindow.location.pathname.startsWith("/auth")
    ? (browserWindow.location.pathname.slice("/auth".length) || "/")
    : browserWindow.location.pathname;
  const authPath = pathWithoutAuthPrefix === "/" ? "/authorisation" : pathWithoutAuthPrefix;
  const targetUrl = `${shellOrigin}/auth${authPath}${browserWindow.location.search}${browserWindow.location.hash}`;
  browserWindow.location.replace(targetUrl);
  return true;
};

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container (#root) not found");
}

if (!redirectStandaloneToShell()) {
  // Standalone mode (when running Auth MF directly on :3001)
  createRoot(container).render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
