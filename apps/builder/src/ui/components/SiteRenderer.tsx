import type { CSSProperties } from "react";
import { PageNode } from "../../renderer/nodeComponents/PageNode";
import type { BuilderDocument, SectionHeight } from "../../domain/document";
import { deriveRenderedHeightPx } from "../../domain/sections";

const AUTO_SECTION_RENDER_MIN_PX = 80;

const getSectionStyles = (height: SectionHeight): CSSProperties => {
  const renderedHeight = deriveRenderedHeightPx({
    height,
    emptyAutoMinRenderPx: AUTO_SECTION_RENDER_MIN_PX,
  });
  if (height.mode === "manual") {
    return { height: `${renderedHeight}px` };
  }
  return { minHeight: `${renderedHeight}px` };
};

export const SiteRenderer = ({
  document,
}: {
  document: BuilderDocument | null;
}) => {
  if (!document) {
    return <div className="min-h-screen bg-white" />;
  }

  const root = document.nodes[document.rootId];
  if (!root || root.type !== "Page") {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <PageNode>
      {root.children?.map((childId) => {
        const node = document.nodes[childId];
        if (!node || node.type !== "Section") return null;
        return (
          <div
            key={node.id}
            className="w-full bg-white"
            style={getSectionStyles(node.section.height)}
          />
        );
      })}
    </PageNode>
  );
};
