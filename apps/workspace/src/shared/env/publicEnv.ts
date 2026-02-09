const useMocksEnv = import.meta.env.VITE_WORKSPACE_USE_MOCKS as string | undefined;

export const publicEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  workspaceUseMocks: useMocksEnv ? useMocksEnv !== "false" : true,
};
