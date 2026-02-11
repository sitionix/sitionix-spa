import { describe, expect, it } from "vitest";
import { computeViewportScale, getViewportSpec } from "../../domain/viewport";

describe("viewport domain", () => {
  it("returns stable viewport specs", () => {
    expect(getViewportSpec("desktop")).toEqual({ widthPx: 1440, heightPx: 900 });
    expect(getViewportSpec("tablet")).toEqual({ widthPx: 768, heightPx: 1024 });
    expect(getViewportSpec("mobile")).toEqual({ widthPx: 390, heightPx: 844 });
  });

  it("computeViewportScale returns 1 when canvas is wide enough", () => {
    const scale = computeViewportScale({
      canvasInnerWidthPx: 1800,
      viewportWidthPx: 1440,
      paddingPx: 24,
    });
    expect(scale).toBe(1);
  });

  it("computeViewportScale returns ratio when canvas is narrow", () => {
    const scale = computeViewportScale({
      canvasInnerWidthPx: 800,
      viewportWidthPx: 1440,
      paddingPx: 24,
    });
    expect(scale).toBeCloseTo((800 - 48) / 1440, 5);
  });

  it("respects padding", () => {
    const scale = computeViewportScale({
      canvasInnerWidthPx: 600,
      viewportWidthPx: 1000,
      paddingPx: 40,
    });
    expect(scale).toBeCloseTo((600 - 80) / 1000, 5);
  });
});
