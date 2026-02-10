export const navigateHost = (path: string) => {
  if (typeof window === "undefined") return;

  if (window.history?.pushState) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    window.location.assign(path);
  }
};
