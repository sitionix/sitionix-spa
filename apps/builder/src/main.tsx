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

  const pathWithoutBuilderPrefix = window.location.pathname.startsWith("/builder")
    ? (window.location.pathname.slice("/builder".length) || "/")
    : window.location.pathname;
  const builderPath = pathWithoutBuilderPrefix === "/" ? "" : pathWithoutBuilderPrefix;
  const targetUrl = `${shellOrigin}/builder${builderPath}${window.location.search}${window.location.hash}`;
  window.location.replace(targetUrl);
  return true;
};

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container (#root) not found");
}

if (!redirectStandaloneToShell()) {
  createRoot(container).render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
