export type WorkspaceSiteStatus = "published" | "draft";

export type WorkspaceSiteType = "standalone" | "ecosystem";

export type WorkspaceSite = {
  id: string;
  name: string;
  domain: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  type: WorkspaceSiteType;
  ecosystemName?: string | null;
  collectionId?: string | null;
  status: WorkspaceSiteStatus;
  createdAt: string;
  updatedAt: string;
  visits: number;
  thumbnailUrl?: string | null;
};

export type WorkspaceTrashItem = WorkspaceSite & {
  deletedAt: string;
};

export type WorkspaceCollection = {
  id: string;
  name: string;
  color: "blue" | "purple" | "orange" | "green";
  sitesCount: number;
};

export type WorkspaceDomainStatus = "active" | "pending";

export type WorkspaceDomain = {
  id: string;
  domain: string;
  status: WorkspaceDomainStatus;
  expiresAt: string;
  siteId?: string | null;
};

export type WorkspaceDashboardSummary = {
  totalSites: number;
  publishedSites: number;
  totalVisits: number;
  activeUsers: number;
  recentSites: Array<Pick<WorkspaceSite, "id" | "name" | "domain" | "visits" | "updatedAt">>;
};

export type WorkspaceCrmOverview = {
  totalViews: number;
  totalViewsChangePct: number;
  averageViewsPerSite: number;
  averageViewsChangePct: number;
  uniqueVisitors: number;
  uniqueVisitorsChangePct: number;
  averageSessionDurationSeconds: number;
};

export type WorkspaceSitePerformance = {
  siteId: string;
  siteName: string;
  domain: string;
  views: number;
  uniqueVisitors: number;
  bounceRatePct: number;
  status: WorkspaceSiteStatus;
};

export type WorkspaceTrafficSource = {
  source: string;
  visits: number;
  percentage: number;
};

export type WorkspaceTopPage = {
  path: string;
  views: number;
};

export type WorkspaceCrmSummary = {
  overview: WorkspaceCrmOverview;
  sitePerformance: WorkspaceSitePerformance[];
  trafficSources: WorkspaceTrafficSource[];
  topPages: WorkspaceTopPage[];
};

export type WorkspaceEditorPaletteItem = {
  id: string;
  label: string;
};

export type WorkspaceEditorPreviewBlock = {
  id: string;
  title: string;
  description: string;
};

export type WorkspaceEditorPreview = {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  blocks: WorkspaceEditorPreviewBlock[];
  footerText: string;
};

export type WorkspaceEditorData = {
  palette: WorkspaceEditorPaletteItem[];
  preview: WorkspaceEditorPreview;
};
