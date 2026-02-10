import type { ReactNode } from "react";

export const PageNode = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="w-full min-h-[640px] bg-white rounded-2xl border border-zinc-200 shadow-sm p-10">
      {children}
    </div>
  );
};
