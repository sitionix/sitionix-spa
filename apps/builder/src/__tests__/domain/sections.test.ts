import { describe, expect, it } from "vitest";
import {
  applySectionCommand,
  computeSectionResize,
  clampPx,
  computeNextHeightOnDrag,
  deriveRenderedHeightPx,
  snapPx,
  validateSectionCommand,
  validateSectionHeightV2,
  type SectionCommand,
} from "../../domain/sections";
import { createInitialDocument } from "../../domain/document";

const createDocumentWithSection = (sectionId: string) => {
  const doc = createInitialDocument("page-1");
  const command: SectionCommand = {
    type: "ADD_SECTION",
    pageId: "page-1",
    sectionId,
    initialHeight: { mode: "auto" },
  };
  const validated = validateSectionCommand(doc, command);
  expect(validated.ok).toBe(true);
  return applySectionCommand(doc, command);
};

describe("sections domain v2", () => {
  it("snaps and clamps values", () => {
    expect(snapPx(14, 8)).toBe(16);
    expect(snapPx(12, 8)).toBe(16);
    expect(snapPx(9, 8)).toBe(8);
    expect(clampPx(50, 100, 200)).toBe(100);
    expect(clampPx(250, 100, 200)).toBe(200);
  });

  it("validates section height v2", () => {
    expect(validateSectionHeightV2({ mode: "auto" }).ok).toBe(true);
    expect(validateSectionHeightV2({ mode: "manual" }).ok).toBe(false);
    expect(
      validateSectionHeightV2({ mode: "manual", heightPx: 0 }).ok
    ).toBe(false);
    expect(
      validateSectionHeightV2({ mode: "manual", heightPx: 200, minPx: 240 }).ok
    ).toBe(false);
    expect(
      validateSectionHeightV2({ mode: "manual", heightPx: 200, maxPx: 180 }).ok
    ).toBe(false);
    expect(
      validateSectionHeightV2({
        mode: "manual",
        heightPx: 200,
        minPx: 120,
        maxPx: 400,
      }).ok
    ).toBe(true);
  });

  it("computes next height on drag", () => {
    const auto = computeNextHeightOnDrag({
      current: { mode: "auto" },
      startHeightPx: 200,
      deltaPx: 40,
      snapUnitPx: 10,
    });
    expect(auto).toEqual({ mode: "manual", heightPx: 240 });

    const manual = computeNextHeightOnDrag({
      current: { mode: "manual", heightPx: 300, minPx: 200, maxPx: 340 },
      startHeightPx: 300,
      deltaPx: 80,
      snapUnitPx: 10,
    });
    expect(manual).toEqual({
      mode: "manual",
      heightPx: 340,
      minPx: 200,
      maxPx: 340,
    });
  });

  it("computes section resize with baseline and clamps", () => {
    const baseline = computeSectionResize({
      startHeightPx: 670,
      deltaPointerYPx: 10,
      mode: "manual",
      constraints: {},
      snapPx: 10,
    });
    expect(baseline.nextHeightPx).toBe(680);

    const clampedMin = computeSectionResize({
      startHeightPx: 670,
      deltaPointerYPx: -600,
      mode: "manual",
      constraints: { minPx: 200 },
      snapPx: 10,
    });
    expect(clampedMin.nextHeightPx).toBe(200);

    const clampedMax = computeSectionResize({
      startHeightPx: 670,
      deltaPointerYPx: 500,
      mode: "manual",
      constraints: { maxPx: 1000 },
      snapPx: 10,
    });
    expect(clampedMax.nextHeightPx).toBe(1000);
  });

  it("derives rendered height", () => {
    const auto = deriveRenderedHeightPx({
      height: { mode: "auto", minPx: 120 },
      emptyAutoMinRenderPx: 80,
    });
    expect(auto).toBe(120);

    const manual = deriveRenderedHeightPx({
      height: { mode: "manual", heightPx: 260 },
      emptyAutoMinRenderPx: 80,
    });
    expect(manual).toBe(260);
  });

  it("adds and updates sections immutably", () => {
    const doc = createInitialDocument("page-1");
    const added = applySectionCommand(doc, {
      type: "ADD_SECTION",
      pageId: "page-1",
      sectionId: "section-1",
      initialHeight: { mode: "auto" },
    });

    expect(added).not.toBe(doc);
    expect(doc.nodes[doc.rootId].children).toHaveLength(0);
    expect(added.nodes[added.rootId].children).toEqual(["section-1"]);

    const updated = applySectionCommand(added, {
      type: "UPDATE_SECTION_HEIGHT",
      sectionId: "section-1",
      height: { mode: "manual", heightPx: 320 },
    });

    expect(updated).not.toBe(added);
    const section = updated.nodes["section-1"];
    expect(section.type).toBe("Section");
    if (section.type === "Section") {
      expect(section.section.height).toEqual({ mode: "manual", heightPx: 320 });
    }
  });

  it("validates section commands", () => {
    const doc = createInitialDocument("page-1");
    const invalid = validateSectionCommand(doc, {
      type: "ADD_SECTION",
      pageId: "page-2",
      sectionId: "section-2",
      initialHeight: { mode: "auto" },
    });
    expect(invalid.ok).toBe(false);

    const withSection = createDocumentWithSection("section-3");
    const updateInvalid = validateSectionCommand(withSection, {
      type: "UPDATE_SECTION_HEIGHT",
      sectionId: "missing",
      height: { mode: "manual", heightPx: 200 },
    });
    expect(updateInvalid.ok).toBe(false);
  });
});
