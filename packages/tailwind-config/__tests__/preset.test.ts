import { describe, expect, it } from "vitest";
import preset from "../preset";

describe("tailwind preset", () => {
  it("exposes brand and accent colors", () => {
    expect(preset.theme?.extend?.colors?.brand?.["500"]).toBe(
      "var(--color-brand-500)"
    );
    expect(preset.theme?.extend?.colors?.accent?.["500"]).toBe(
      "var(--color-accent-500)"
    );
  });

  it("keeps plugins list empty", () => {
    expect(preset.plugins).toEqual([]);
  });
});
