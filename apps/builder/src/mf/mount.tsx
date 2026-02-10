import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { App } from "../app/App";
import "../style.css";

export type MountOptions = {
  basename?: string;
};

export type MountResult = {
  unmount: () => void;
};

export type MountFn = (container: Element, options?: MountOptions) => MountResult;

const roots = new WeakMap<Element, Root>();

export const mount: MountFn = (container, options) => {
  let root = roots.get(container);

  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }

  const basename = options?.basename;
  const resolveInitialEntry = () => {
    const win = globalThis.window;
    if (!win) return basename ?? "/";
    const currentPath = `${win.location.pathname}${win.location.search}${win.location.hash}`;
    if (basename && currentPath.startsWith(basename)) return currentPath;
    return basename ?? (currentPath || "/");
  };
  const initialEntries = [resolveInitialEntry()];

  root.render(
    <React.StrictMode>
      <MemoryRouter
        basename={basename}
        initialEntries={initialEntries}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    </React.StrictMode>
  );

  return {
    unmount: () => {
      if (roots.get(container) === root) {
        root.unmount();
        roots.delete(container);
      }
    },
  };
};

export default mount;
