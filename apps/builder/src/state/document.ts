export type Breakpoint = "desktop" | "tablet" | "mobile";

export type BuilderNode = {
  id: string;
  type: "Page";
  children?: string[];
};

export type BuilderDocument = {
  pageId: string;
  version: number;
  rootId: string;
  nodes: Record<string, BuilderNode>;
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
