import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold text-zinc-900">{title}</h1>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {subtitle ? <p className="text-zinc-600">{subtitle}</p> : null}
    </div>
  );
}
