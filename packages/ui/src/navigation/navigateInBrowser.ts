export const navigateInBrowser = (path: string): void => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return;
  }

  const fallbackNavigate = (): void => {
    if (!browserWindow.history?.pushState) {
      return;
    }

    browserWindow.history.pushState({}, "", path);
    browserWindow.dispatchEvent(new PopStateEvent("popstate"));
  };

  const userAgent = browserWindow.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom")) {
    fallbackNavigate();
    return;
  }

  try {
    browserWindow.location.assign(path);
  } catch {
    fallbackNavigate();
  }
};
