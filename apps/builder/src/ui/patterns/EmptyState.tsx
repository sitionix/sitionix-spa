import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export const EmptyState = ({
  title,
  subtitle,
  action,
  className,
  titleClassName,
  subtitleClassName,
}: EmptyStateProps) => {
  return (
    <div className={`space-y-2 ${className ?? ""}`.trim()}>
      <div className={titleClassName ?? "text-sm font-semibold text-zinc-900"}>
        {title}
      </div>
      {subtitle ? (
        <p className={subtitleClassName ?? "text-xs text-zinc-500"}>
          {subtitle}
        </p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
};
