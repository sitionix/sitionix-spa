export type Breakpoint = "desktop" | "tablet" | "mobile";

export type NodeId = string;

export type SectionHeight = {
  mode: "auto" | "manual";
  heightPx?: number;
  minPx?: number;
  maxPx?: number;
};

export type BuilderNode =
  | {
      id: NodeId;
      type: "Page";
      children: NodeId[];
    }
  | {
      id: NodeId;
      type: "Section";
      children?: NodeId[];
      section: {
        height: SectionHeight;
      };
    };

export type BuilderDocument = {
  pageId: string;
  version: number;
  rootId: NodeId;
  nodes: Record<NodeId, BuilderNode>;
};

const DEFAULT_PAGE_ID = "local";

export const createInitialDocument = (
  pageId: string = DEFAULT_PAGE_ID
): BuilderDocument => {
  const rootId = "page-1";
  return {
    pageId,
    version: 1,
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        type: "Page",
        children: [],
      },
    },
  };
};

export const isBuilderDocument = (value: unknown): value is BuilderDocument => {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodes" in value &&
    "rootId" in value
  );
};
