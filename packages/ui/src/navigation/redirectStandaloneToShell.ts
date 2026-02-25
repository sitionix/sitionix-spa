export type StandaloneShellRedirectOptions = {
  shellOrigin: string;
  standalonePrefix: string;
  shellPrefix: string;
  defaultPath: string;
};

export const redirectStandaloneToShell = (
  options: StandaloneShellRedirectOptions
): boolean => {
  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return false;
  }

  const userAgent = browserWindow.navigator?.userAgent ?? "";
  if (userAgent.includes("jsdom")) {
    return false;
  }

  if (browserWindow.location.origin === options.shellOrigin) {
    return false;
  }

  const pathWithoutStandalonePrefix = browserWindow.location.pathname.startsWith(
    options.standalonePrefix
  )
    ? (browserWindow.location.pathname.slice(options.standalonePrefix.length) ||
      "/")
    : browserWindow.location.pathname;

  const targetPath =
    pathWithoutStandalonePrefix === "/"
      ? options.defaultPath
      : pathWithoutStandalonePrefix;
  const targetUrl = `${options.shellOrigin}${options.shellPrefix}${targetPath}${browserWindow.location.search}${browserWindow.location.hash}`;

  browserWindow.location.replace(targetUrl);
  return true;
};
