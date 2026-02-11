import type { BuilderDocument, NodeId, SectionHeight } from "./document";

export type SectionCommand =
  | {
      type: "ADD_SECTION";
      pageId: string;
      sectionId: NodeId;
      initialHeight: SectionHeight;
    }
  | {
      type: "UPDATE_SECTION_HEIGHT";
      sectionId: NodeId;
      height: SectionHeight;
    }
  | {
      type: "UPDATE_SECTION_CONSTRAINTS";
      sectionId: NodeId;
      patch: { minPx?: number; maxPx?: number };
    }
  | {
      type: "SET_SECTION_HEIGHT_MODE";
      sectionId: NodeId;
      mode: "auto" | "manual";
    };

export type SectionValidationResult =
  | { ok: true }
  | { ok: false; reason: string; field?: "height" | "min" | "max" };

export const snapPx = (valuePx: number, unitPx: number): number => {
  if (!Number.isFinite(valuePx) || !Number.isFinite(unitPx) || unitPx <= 0) {
    return Math.round(valuePx);
  }
  return Math.round(valuePx / unitPx) * unitPx;
};

export const convertRenderedHeightToPagePx = (
  renderedHeightPx: number,
  scale: number
): number => {
  if (!Number.isFinite(renderedHeightPx)) return 0;
  if (!Number.isFinite(scale) || scale <= 0) {
    return Math.round(renderedHeightPx);
  }
  return Math.round(renderedHeightPx / scale);
};

export const convertPointerDeltaToPagePx = (
  deltaPointerPx: number,
  scale: number
): number => {
  if (!Number.isFinite(deltaPointerPx)) return 0;
  if (!Number.isFinite(scale) || scale <= 0) return deltaPointerPx;
  return deltaPointerPx / scale;
};

export const clampPx = (
  valuePx: number,
  minPx?: number,
  maxPx?: number
): number => {
  let next = valuePx;
  if (typeof minPx === "number" && Number.isFinite(minPx)) {
    next = Math.max(next, minPx);
  }
  if (typeof maxPx === "number" && Number.isFinite(maxPx)) {
    next = Math.min(next, maxPx);
  }
  return next;
};

export const computeSectionResize = (params: {
  startHeightPx: number;
  deltaPointerYPx: number;
  mode: "auto" | "manual";
  constraints: { minPx?: number; maxPx?: number };
  snapPx: number;
}): { nextHeightPx: number; clamped: boolean } => {
  const raw = params.startHeightPx + params.deltaPointerYPx;
  const snapped = snapPx(raw, params.snapPx);
  const clampedValue = Math.max(
    1,
    clampPx(snapped, params.constraints.minPx, params.constraints.maxPx)
  );
  return { nextHeightPx: clampedValue, clamped: clampedValue !== snapped };
};

export const applyResizeToSectionHeight = (
  current: SectionHeight,
  nextHeightPx: number
): SectionHeight => {
  if (current.mode === "auto") {
    return {
      mode: "manual",
      heightPx: nextHeightPx,
      minPx: current.minPx,
      maxPx: current.maxPx,
    };
  }
  return {
    ...current,
    mode: "manual",
    heightPx: nextHeightPx,
  };
};

export const validateSectionHeightV2 = (
  height: SectionHeight
): SectionValidationResult => {
  if (height.mode !== "auto" && height.mode !== "manual") {
    return { ok: false, reason: "Invalid height mode." };
  }

  if (height.mode === "manual") {
    if (height.heightPx === undefined || height.heightPx === null) {
      return {
        ok: false,
        reason: "Height is required in Manual mode.",
        field: "height",
      };
    }
    if (!Number.isFinite(height.heightPx)) {
      return { ok: false, reason: "Height must be a number.", field: "height" };
    }
    if (height.heightPx <= 0) {
      return {
        ok: false,
        reason: "Height must be greater than 0.",
        field: "height",
      };
    }
  }

  if (height.minPx !== undefined) {
    if (!Number.isFinite(height.minPx)) {
      return { ok: false, reason: "Min height must be a number.", field: "min" };
    }
    if (height.minPx <= 0) {
      return {
        ok: false,
        reason: "Min height must be greater than 0.",
        field: "min",
      };
    }
  }

  if (height.maxPx !== undefined) {
    if (!Number.isFinite(height.maxPx)) {
      return { ok: false, reason: "Max height must be a number.", field: "max" };
    }
    if (height.maxPx <= 0) {
      return {
        ok: false,
        reason: "Max height must be greater than 0.",
        field: "max",
      };
    }
  }

  if (
    height.minPx !== undefined &&
    height.maxPx !== undefined &&
    height.minPx > height.maxPx
  ) {
    return {
      ok: false,
      reason: "Min height must be less than or equal to max height.",
      field: "max",
    };
  }

  if (height.mode === "manual" && height.heightPx !== undefined) {
    if (height.minPx !== undefined && height.heightPx < height.minPx) {
      return {
        ok: false,
        reason: "Height must be at least the min height.",
        field: "height",
      };
    }
    if (height.maxPx !== undefined && height.heightPx > height.maxPx) {
      return {
        ok: false,
        reason: "Height must be at most the max height.",
        field: "height",
      };
    }
  }

  return { ok: true };
};

export const computeNextHeightOnDrag = (params: {
  current: SectionHeight;
  startHeightPx: number;
  deltaPx: number;
  snapUnitPx: number;
}): SectionHeight => {
  const { nextHeightPx } = computeSectionResize({
    startHeightPx: params.startHeightPx,
    deltaPointerYPx: params.deltaPx,
    mode: params.current.mode,
    constraints: { minPx: params.current.minPx, maxPx: params.current.maxPx },
    snapPx: params.snapUnitPx,
  });

  return applyResizeToSectionHeight(params.current, nextHeightPx);
};

export const deriveRenderedHeightPx = (params: {
  height: SectionHeight;
  emptyAutoMinRenderPx: number;
}): number => {
  if (params.height.mode === "manual") {
    const base = params.height.heightPx ?? params.emptyAutoMinRenderPx;
    return clampPx(base, params.height.minPx, params.height.maxPx);
  }

  const base = Math.max(params.emptyAutoMinRenderPx, params.height.minPx ?? 0);
  return clampPx(base, params.height.minPx, params.height.maxPx);
};

const validateDocumentRoot = (
  document: BuilderDocument
): SectionValidationResult => {
  const root = document.nodes[document.rootId];
  if (!root || root.type !== "Page") {
    return { ok: false, reason: "Document root is invalid." };
  }
  return { ok: true };
};

const applyConstraintPatch = (
  height: SectionHeight,
  patch: { minPx?: number; maxPx?: number }
): SectionHeight => {
  return {
    ...height,
    minPx: "minPx" in patch ? patch.minPx : height.minPx,
    maxPx: "maxPx" in patch ? patch.maxPx : height.maxPx,
  };
};

export const validateSectionCommand = (
  document: BuilderDocument,
  command: SectionCommand
): SectionValidationResult => {
  switch (command.type) {
    case "ADD_SECTION": {
      if (document.pageId !== command.pageId) {
        return { ok: false, reason: "Page mismatch." };
      }
      const rootResult = validateDocumentRoot(document);
      if (!rootResult.ok) return rootResult;
      if (document.nodes[command.sectionId]) {
        return { ok: false, reason: "Section already exists." };
      }
      const heightResult = validateSectionHeightV2(command.initialHeight);
      return heightResult.ok ? { ok: true } : heightResult;
    }
    case "UPDATE_SECTION_HEIGHT": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") {
        return { ok: false, reason: "Section not found." };
      }
      const heightResult = validateSectionHeightV2(command.height);
      return heightResult.ok ? { ok: true } : heightResult;
    }
    case "UPDATE_SECTION_CONSTRAINTS": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") {
        return { ok: false, reason: "Section not found." };
      }
      const nextHeight = applyConstraintPatch(node.section.height, command.patch);
      const heightResult = validateSectionHeightV2(nextHeight);
      return heightResult.ok ? { ok: true } : heightResult;
    }
    case "SET_SECTION_HEIGHT_MODE": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") {
        return { ok: false, reason: "Section not found." };
      }
      const nextHeight: SectionHeight =
        command.mode === "auto"
          ? {
              mode: "auto",
              minPx: node.section.height.minPx,
              maxPx: node.section.height.maxPx,
            }
          : {
              mode: "manual",
              heightPx: node.section.height.heightPx,
              minPx: node.section.height.minPx,
              maxPx: node.section.height.maxPx,
            };
      const heightResult = validateSectionHeightV2(nextHeight);
      return heightResult.ok ? { ok: true } : heightResult;
    }
    default:
      return { ok: true };
  }
};

export const applySectionCommand = (
  document: BuilderDocument,
  command: SectionCommand
): BuilderDocument => {
  switch (command.type) {
    case "ADD_SECTION": {
      const root = document.nodes[document.rootId];
      if (!root || root.type !== "Page") return document;

      const nextNodes = {
        ...document.nodes,
        [command.sectionId]: {
          id: command.sectionId,
          type: "Section",
          section: { height: command.initialHeight },
        },
      };
      const nextChildren = [...root.children, command.sectionId];
      nextNodes[document.rootId] = { ...root, children: nextChildren };

      return {
        ...document,
        nodes: nextNodes,
      };
    }
    case "UPDATE_SECTION_HEIGHT": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") return document;
      return {
        ...document,
        nodes: {
          ...document.nodes,
          [command.sectionId]: {
            ...node,
            section: { ...node.section, height: command.height },
          },
        },
      };
    }
    case "UPDATE_SECTION_CONSTRAINTS": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") return document;
      const nextHeight = applyConstraintPatch(node.section.height, command.patch);
      return {
        ...document,
        nodes: {
          ...document.nodes,
          [command.sectionId]: {
            ...node,
            section: { ...node.section, height: nextHeight },
          },
        },
      };
    }
    case "SET_SECTION_HEIGHT_MODE": {
      const node = document.nodes[command.sectionId];
      if (!node || node.type !== "Section") return document;
      const nextHeight: SectionHeight =
        command.mode === "auto"
          ? {
              mode: "auto",
              minPx: node.section.height.minPx,
              maxPx: node.section.height.maxPx,
            }
          : {
              mode: "manual",
              heightPx: node.section.height.heightPx,
              minPx: node.section.height.minPx,
              maxPx: node.section.height.maxPx,
            };
      return {
        ...document,
        nodes: {
          ...document.nodes,
          [command.sectionId]: {
            ...node,
            section: { ...node.section, height: nextHeight },
          },
        },
      };
    }
    default:
      return document;
  }
};
