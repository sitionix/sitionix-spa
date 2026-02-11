export type NodeId = string;

export type SectionHeightV2 = {
  mode: "auto" | "manual";
  heightPx?: number;
  minPx?: number;
  maxPx?: number;
};

export type SectionHeight = SectionHeightV2;

export type PageNode = {
  id: NodeId;
  type: "Page";
  children: NodeId[];
};

export type SectionNode = {
  id: NodeId;
  type: "Section";
  children?: NodeId[];
  section: {
    height: SectionHeight;
  };
};

export type BuilderNode = PageNode | SectionNode;

export type BuilderDocument = {
  pageId: string;
  version: number;
  rootId: NodeId;
  nodes: Record<NodeId, BuilderNode>;
};
