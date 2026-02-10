import type { ReactNode } from "react";

type PanelShellProps = {
  title: string;
  children?: ReactNode;
};

export const PanelShell = ({ title, children }: PanelShellProps) => {
  return (
    <div className="h-full border-zinc-200 bg-white flex flex-col">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
};
