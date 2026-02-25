// apps/auth/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./style.css";
import { App } from "./app/App";

const redirectStandaloneToShell = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom")) {
    return false;
  }

  const shellOrigin = (import.meta.env.VITE_SHELL_ORIGIN as string | undefined)?.trim();
  if (!shellOrigin) {
    throw new Error("Missing required env variable: VITE_SHELL_ORIGIN");
  }

  if (window.location.origin === shellOrigin) {
    return false;
  }

  const pathWithoutAuthPrefix = window.location.pathname.startsWith("/auth")
    ? (window.location.pathname.slice("/auth".length) || "/")
    : window.location.pathname;
  const authPath = pathWithoutAuthPrefix === "/" ? "/authorisation" : pathWithoutAuthPrefix;
  const targetUrl = `${shellOrigin}/auth${authPath}${window.location.search}${window.location.hash}`;
  window.location.replace(targetUrl);
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
