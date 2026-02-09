import type {
  WorkspaceCollection,
  WorkspaceDomain,
  WorkspaceEditorData,
  WorkspaceEditorPaletteItem,
  WorkspaceEditorPreview,
  WorkspaceSite,
  WorkspaceTrashItem,
} from "@sitionix/contracts";

export type WorkspaceMockState = {
  sites: WorkspaceSite[];
  trash: WorkspaceTrashItem[];
  collections: WorkspaceCollection[];
  domains: WorkspaceDomain[];
  editorBySiteId: Record<string, WorkspaceEditorData>;
};

const defaultPalette: WorkspaceEditorPaletteItem[] = [
  { id: "text", label: "Текст" },
  { id: "image", label: "Зображення" },
  { id: "button", label: "Кнопка" },
  { id: "form", label: "Форма" },
  { id: "video", label: "Відео" },
  { id: "gallery", label: "Галерея" },
];

const createPreview = (site: WorkspaceSite): WorkspaceEditorPreview => ({
  heroTitle: `Ласкаво просимо на ${site.name}`,
  heroSubtitle:
    site.description ??
    "Це демонстраційна сторінка вашого сайту. Використовуйте конструктор для додавання блоків.",
  ctaLabel: "Дізнатися більше",
  blocks: [
    {
      id: "block-1",
      title: "Контентний блок",
      description: "Додайте текст, медіа та CTA у потрібному місці.",
    },
    {
      id: "block-2",
      title: "Продукти та послуги",
      description: "Опишіть пропозицію та підкресліть ключові переваги.",
    },
    {
      id: "block-3",
      title: "Соціальний доказ",
      description: "Покажіть відгуки, кейси або логотипи партнерів.",
    },
  ],
  footerText: `© 2026 ${site.name}`,
});

export const createEditorData = (site: WorkspaceSite): WorkspaceEditorData => ({
  palette: defaultPalette,
  preview: createPreview(site),
});

export function createMockWorkspaceState(): WorkspaceMockState {
  const sites: WorkspaceSite[] = [
    {
      id: "site-1",
      name: "Корпоративний сайт",
      domain: "corporate.sitionix.com",
      description: "Офіційний корпоративний сайт компанії",
      seoTitle: "Корпоративний сайт — Sitionix",
      seoDescription: "Офіційний корпоративний сайт нашої компанії",
      type: "ecosystem",
      ecosystemName: "MyBusiness",
      collectionId: "col-1",
      status: "published",
      createdAt: "2026-01-12T09:15:00.000Z",
      updatedAt: "2026-02-05T12:30:00.000Z",
      visits: 1234,
      thumbnailUrl: null,
    },
    {
      id: "site-2",
      name: "Інтернет-магазин",
      domain: "shop.sitionix.ua",
      description: "Онлайн магазин товарів",
      seoTitle: "Інтернет-магазин — Sitionix",
      seoDescription: "Платформа для продажу товарів онлайн",
      type: "standalone",
      collectionId: "col-2",
      status: "draft",
      createdAt: "2026-01-18T14:05:00.000Z",
      updatedAt: "2026-02-02T10:15:00.000Z",
      visits: 856,
      thumbnailUrl: null,
    },
    {
      id: "site-3",
      name: "Блог компанії",
      domain: "blog.sitionix.com",
      description: "Корпоративний блог з новинами",
      seoTitle: "Блог компанії — Sitionix",
      seoDescription: "Новини, кейси та оновлення екосистеми",
      type: "ecosystem",
      ecosystemName: "MyBusiness",
      collectionId: "col-1",
      status: "published",
      createdAt: "2026-01-08T08:30:00.000Z",
      updatedAt: "2026-02-07T16:45:00.000Z",
      visits: 2341,
      thumbnailUrl: null,
    },
    {
      id: "site-4",
      name: "Лендінг продукту",
      domain: "launch.sitionix.io",
      description: "Лендінг для запуску нового продукту",
      seoTitle: "Лендінг продукту — Sitionix",
      seoDescription: "Запуск продукту, ключові переваги та офер",
      type: "standalone",
      status: "published",
      createdAt: "2026-01-05T11:00:00.000Z",
      updatedAt: "2026-02-01T09:10:00.000Z",
      visits: 567,
      thumbnailUrl: null,
    },
    {
      id: "site-5",
      name: "Портфоліо агенції",
      domain: "agency.sitionix.design",
      description: "Портфоліо та послуги агенції",
      seoTitle: "Портфоліо агенції — Sitionix",
      seoDescription: "Кейси та рішення для клієнтів",
      type: "standalone",
      status: "draft",
      createdAt: "2026-01-28T13:20:00.000Z",
      updatedAt: "2026-01-29T18:40:00.000Z",
      visits: 214,
      thumbnailUrl: null,
    },
  ];

  const trash: WorkspaceTrashItem[] = [
    {
      id: "site-6",
      name: "Тестовий лендинг",
      domain: "test.sitionix.dev",
      description: "Тестовий лендинг для експериментів",
      seoTitle: "Тестовий лендинг",
      seoDescription: "Експериментальний проект",
      type: "standalone",
      status: "draft",
      createdAt: "2025-12-18T10:20:00.000Z",
      updatedAt: "2026-01-02T07:45:00.000Z",
      visits: 48,
      thumbnailUrl: null,
      deletedAt: "2026-02-06T15:10:00.000Z",
    },
  ];

  const collections: WorkspaceCollection[] = [
    { id: "col-1", name: "Клієнтські проекти", color: "blue", sitesCount: 2 },
    { id: "col-2", name: "Особисті сайти", color: "purple", sitesCount: 1 },
    { id: "col-3", name: "Тестові проекти", color: "orange", sitesCount: 0 },
    { id: "col-4", name: "Внутрішні", color: "green", sitesCount: 0 },
  ];

  const domains: WorkspaceDomain[] = [
    {
      id: "dom-1",
      domain: "corporate.sitionix.com",
      status: "active",
      expiresAt: "2026-12-15T00:00:00.000Z",
      siteId: "site-1",
    },
    {
      id: "dom-2",
      domain: "shop.sitionix.ua",
      status: "active",
      expiresAt: "2026-08-03T00:00:00.000Z",
      siteId: "site-2",
    },
    {
      id: "dom-3",
      domain: "beta.sitionix.net",
      status: "pending",
      expiresAt: "2026-02-20T00:00:00.000Z",
      siteId: null,
    },
  ];

  const editorBySiteId: Record<string, WorkspaceEditorData> = Object.fromEntries(
    sites.map((site) => [site.id, createEditorData(site)])
  );

  return {
    sites,
    trash,
    collections,
    domains,
    editorBySiteId,
  };
}
