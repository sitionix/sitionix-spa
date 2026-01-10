// apps/auth/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./style.css";
import { App } from "./app/App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container (#root) not found");
}

// Standalone mode (when running Auth MF directly on :3001)
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
