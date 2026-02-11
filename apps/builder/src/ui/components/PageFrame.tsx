import type { ReactNode } from "react";

export const PageFrame = ({
  viewportWidthPx,
  viewportHeightPx,
  children,
}: {
  viewportWidthPx: number;
  viewportHeightPx: number;
  children: ReactNode;
}) => {
  return (
    <div className="mx-auto transition-all duration-300">
      <div className="relative" style={{ width: `${viewportWidthPx}px` }}>
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 border border-zinc-300"
          style={{
            width: `${viewportWidthPx}px`,
            height: `${viewportHeightPx}px`,
          }}
          aria-hidden="true"
          data-page-frame="viewport"
        />
        <div
          className="relative bg-white"
          style={{ width: `${viewportWidthPx}px` }}
          data-page-frame="content"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
