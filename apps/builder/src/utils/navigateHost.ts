export const navigateHost = (path: string) => {
  const win = globalThis.window;
  if (!win) return;

  if (win.history?.pushState) {
    win.history.pushState({}, "", path);
    win.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    win.location.assign(path);
  }
};
