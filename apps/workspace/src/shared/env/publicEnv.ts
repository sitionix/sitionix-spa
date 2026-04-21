const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
if (!apiBaseUrl) {
  throw new Error("Missing required env variable: VITE_API_BASE_URL");
}

export const publicEnv = {
  apiBaseUrl,
};
