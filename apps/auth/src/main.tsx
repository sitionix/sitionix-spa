import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { redirectStandaloneToShell } from "@sitionix/ui";

import "./style.css";
import { App } from "./app/App";

const shellOrigin = (import.meta.env.VITE_SHELL_ORIGIN as string | undefined)?.trim();
if (!shellOrigin) {
  throw new Error("Missing required env variable: VITE_SHELL_ORIGIN");
}

const isStandaloneRedirect = redirectStandaloneToShell({
  shellOrigin,
  standalonePrefix: "/auth",
  shellPrefix: "/auth",
  defaultPath: "/authorisation",
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container (#root) not found");
}

if (!isStandaloneRedirect) {
  createRoot(container).render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
