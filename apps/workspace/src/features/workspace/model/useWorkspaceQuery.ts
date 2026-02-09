import { useCallback, useEffect, useRef, useState } from "react";

export type WorkspaceQueryStatus = "idle" | "loading" | "ready" | "error";

export type WorkspaceQueryState<TData> = {
  status: WorkspaceQueryStatus;
  data: TData | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useWorkspaceQuery<TData>(
  fetcher: () => Promise<TData>,
  deps: unknown[] = []
): WorkspaceQueryState<TData> {
  const [status, setStatus] = useState<WorkspaceQueryStatus>("idle");
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (isMounted.current) {
      setStatus("loading");
      setError(null);
    }
    try {
      const result = await fetcher();
      if (isMounted.current) {
        setData(result);
        setStatus("ready");
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Unexpected error");
        setStatus("error");
      }
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, data, error, refresh };
}
