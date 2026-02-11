import type { Breakpoint } from "./document";

export type ViewportSpec = {
  widthPx: number;
  heightPx: number;
};

const VIEWPORT_SPECS: Record<Breakpoint, ViewportSpec> = {
  desktop: { widthPx: 1440, heightPx: 900 },
  tablet: { widthPx: 768, heightPx: 1024 },
  mobile: { widthPx: 390, heightPx: 844 },
};

export const getViewportSpec = (breakpoint: Breakpoint): ViewportSpec => {
  const spec = VIEWPORT_SPECS[breakpoint] ?? VIEWPORT_SPECS.desktop;
  return { ...spec };
};

export const computeViewportScale = (params: {
  canvasInnerWidthPx: number;
  viewportWidthPx: number;
  paddingPx: number;
  maxScale?: number;
}): number => {
  const maxScale = params.maxScale ?? 1;
  if (!Number.isFinite(params.viewportWidthPx) || params.viewportWidthPx <= 0) {
    return 1;
  }
  if (!Number.isFinite(params.canvasInnerWidthPx) || params.canvasInnerWidthPx <= 0) {
    return 1;
  }
  const padding = Math.max(0, params.paddingPx);
  const available = params.canvasInnerWidthPx - padding * 2;
  if (available <= 0) return 1;
  const ratio = available / params.viewportWidthPx;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.min(maxScale, ratio);
};
