// apps/shell/src/mf/AuthRemote.tsx
import { useEffect, useRef, useState } from "react";

type MountResult = { unmount: () => void };
type MountFn = (container: Element, options?: { basename?: string }) => MountResult;

type Props = {
  basename: string; // e.g. "/auth"
};

export function AuthRemote({ basename }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const host = containerRef.current;
        if (!host || cancelled) return;

        const mod = (await import("auth/mount")) as unknown as {
          mount?: MountFn;
          default?: MountFn;
        };

        if (cancelled) return;

        const fn = typeof mod.mount === "function" ? mod.mount : mod.default;

        if (typeof fn !== "function") {
          const keys = Object.keys(mod ?? {});
          throw new Error(`Remote 'auth/mount' has no mount function. Exports: [${keys.join(", ")}]`);
        }

        const res = fn(host, { basename });
        cleanup = res.unmount;
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [basename]);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Failed to load Auth MF: {error}
        </div>
      </div>
    );
  }

  return <div ref={containerRef} />;
}
