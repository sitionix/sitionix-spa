import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Settings,
  Copy,
  FolderInput,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { Page, WorkspaceCollection, WorkspaceSite } from "@sitionix/contracts";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { getSites } from "../../api/sitesApi";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDate } from "../../model/formatters";
import { PageHeader } from "../components/PageHeader";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { CreateSiteSheet } from "../components/CreateSiteSheet";
import { toneClasses } from "../colorTokens";
import { navigateHost } from "../../../../shared/navigation/navigateHost";

type MenuAction =
  | "edit"
  | "settings"
  | "duplicate"
  | "collection"
  | "delete";

const sortLabels: Record<string, string> = {
  date: "Дата створення",
  name: "Назва",
  edited: "Останнє редагування",
};

const SITES_PAGE_SIZE = 20;
const AUTO_REFETCH_DELAYS_MS = [0, 500, 1000, 2000, 4000] as const;

const dedupeSitesById = (items: WorkspaceSite[]): WorkspaceSite[] => {
  const seenIds = new Set<string>();
  return items.filter((site) => {
    if (seenIds.has(site.id)) {
      return false;
    }
    seenIds.add(site.id);
    return true;
  });
};

const hasNextSitesPage = (page: Page<WorkspaceSite>): boolean => {
  return page.meta.page + 1 < page.meta.totalPages;
};

const toErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unexpected error";
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export function SitesPage() {
  const api = useWorkspaceApi();
  const isMountedRef = useRef(true);
  const refreshPromiseRef = useRef<Promise<Page<WorkspaceSite> | null> | null>(null);
  const refreshQueryKeyRef = useRef<string | null>(null);
  const requestTokenRef = useRef(0);
  const isLoadingNextPageRef = useRef(false);
  const nextPageRef = useRef(1);
  const hasNextPageRef = useRef(false);
  const autoRefetchSequenceRef = useRef(0);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "edited">("date");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<WorkspaceSite | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [sites, setSites] = useState<WorkspaceSite[]>([]);
  const [sitesStatus, setSitesStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [isRefreshingSites, setIsRefreshingSites] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const collectionsQuery = useWorkspaceQuery(
    () => api.getCollections(),
    [api]
  );

  const refreshSitesPageZero = useCallback(async (): Promise<Page<WorkspaceSite> | null> => {
    const queryKey = `${search}\u0000${sortBy}`;
    if (refreshPromiseRef.current && refreshQueryKeyRef.current === queryKey) {
      return refreshPromiseRef.current;
    }

    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;
    refreshQueryKeyRef.current = queryKey;
    const request = (async () => {
      if (isMountedRef.current) {
        setSitesStatus("loading");
        setSitesError(null);
        setIsRefreshingSites(true);
        setIsLoadingNextPage(false);
      }
      isLoadingNextPageRef.current = false;

      try {
        const firstPage = await getSites({
          page: 0,
          size: SITES_PAGE_SIZE,
          search,
          sortBy,
        });

        if (!isMountedRef.current || requestTokenRef.current !== requestToken) {
          return null;
        }

        const nextPage = firstPage.meta.page + 1;
        const hasNext = hasNextSitesPage(firstPage);

        setSites(dedupeSitesById(firstPage.items));
        setSitesStatus("ready");
        setHasNextPage(hasNext);
        nextPageRef.current = nextPage;
        hasNextPageRef.current = hasNext;
        return firstPage;
      } catch (error) {
        if (isMountedRef.current && requestTokenRef.current === requestToken) {
          setSitesStatus("error");
          setSitesError(toErrorMessage(error));
        }
        return null;
      } finally {
        if (refreshPromiseRef.current === request) {
          refreshPromiseRef.current = null;
          refreshQueryKeyRef.current = null;
        }
        if (isMountedRef.current && requestTokenRef.current === requestToken) {
          setIsRefreshingSites(false);
        }
      }
    })();

    refreshPromiseRef.current = request;
    return request;
  }, [search, sortBy]);

  const loadNextSitesPage = useCallback(async () => {
    if (
      !hasNextPageRef.current ||
      isLoadingNextPageRef.current ||
      refreshPromiseRef.current
    ) {
      return;
    }

    const requestToken = requestTokenRef.current;
    isLoadingNextPageRef.current = true;
    if (isMountedRef.current) {
      setIsLoadingNextPage(true);
      setSitesError(null);
    }

    try {
      const page = nextPageRef.current;
      const nextPageResult = await getSites({
        page,
        size: SITES_PAGE_SIZE,
        search,
        sortBy,
      });
      if (!isMountedRef.current || requestTokenRef.current !== requestToken) {
        return;
      }
      const nextPage = nextPageResult.meta.page + 1;
      const hasNext = hasNextSitesPage(nextPageResult);

      setSites((previous) =>
        dedupeSitesById([...previous, ...nextPageResult.items])
      );
      setSitesStatus("ready");
      setHasNextPage(hasNext);
      nextPageRef.current = nextPage;
      hasNextPageRef.current = hasNext;
    } catch (error) {
      if (isMountedRef.current && requestTokenRef.current === requestToken) {
        setSitesStatus("error");
        setSitesError(toErrorMessage(error));
      }
    } finally {
      if (requestTokenRef.current === requestToken) {
        isLoadingNextPageRef.current = false;
      }
      if (isMountedRef.current && requestTokenRef.current === requestToken) {
        setIsLoadingNextPage(false);
      }
    }
  }, [search, sortBy]);

  const runAutoRefetchAfterCreate = useCallback(
    async (siteId: string) => {
      const sequenceId = autoRefetchSequenceRef.current + 1;
      autoRefetchSequenceRef.current = sequenceId;
      let previousDelayMs = 0;

      for (const delayMs of AUTO_REFETCH_DELAYS_MS) {
        if (!isMountedRef.current || autoRefetchSequenceRef.current !== sequenceId) {
          return;
        }

        const waitTime = delayMs - previousDelayMs;
        previousDelayMs = delayMs;

        if (waitTime > 0) {
          await delay(waitTime);
        }

        if (!isMountedRef.current || autoRefetchSequenceRef.current !== sequenceId) {
          return;
        }

        const firstPage = await refreshSitesPageZero();
        if (firstPage?.items.some((site) => site.id === siteId)) {
          return;
        }
      }
    },
    [refreshSitesPageZero]
  );

  useEffect(() => {
    void refreshSitesPageZero();
  }, [refreshSitesPageZero]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      autoRefetchSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextSitesPage();
        }
      },
      {
        rootMargin: "300px 0px",
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadNextSitesPage, hasNextPage]);

  const collectionsById = useMemo(() => {
    const map = new Map<string, WorkspaceCollection>();
    collectionsQuery.data?.items.forEach((collection) => {
      map.set(collection.id, collection);
    });
    return map;
  }, [collectionsQuery.data]);

  const displayedSites = sites;

  const openBuilder = useCallback((siteId: string) => {
    navigateHost(`/builder/${siteId}`);
  }, []);

  const openOverview = useCallback((siteId: string) => {
    navigateHost(`/workspace/sites/${siteId}/settings`);
  }, []);

  const handleMenuAction = (action: MenuAction, site: WorkspaceSite) => {
    setOpenMenuId(null);
    setSelectedSite(site);

    switch (action) {
      case "edit":
        openBuilder(site.id);
        break;
      case "settings":
        openOverview(site.id);
        break;
      case "duplicate":
        api.duplicateSite(site.id).then(() => {
          void refreshSitesPageZero();
        });
        break;
      case "collection":
        setSelectedCollectionId(site.collectionId ?? null);
        setCollectionModalOpen(true);
        break;
      case "delete":
        setDeleteModalOpen(true);
        break;
    }
  };

  const confirmDelete = async () => {
    if (!selectedSite) return;
    await api.deleteSite(selectedSite.id);
    await refreshSitesPageZero();
    setDeleteModalOpen(false);
    setSelectedSite(null);
  };

  const closeCollectionModal = () => {
    setCollectionModalOpen(false);
    setSelectedSite(null);
    setSelectedCollectionId(null);
  };

  const handleSiteCreated = (siteId: string, siteName: string) => {
    setCreateSheetOpen(false);
    const encodedName = encodeURIComponent(siteName.trim());
    const opened = window.open(
      `/builder/${siteId}?siteName=${encodedName}`,
      "_blank"
    );
    if (opened) {
      opened.focus();
    }
    void runAutoRefetchAfterCreate(siteId);
  };

  const confirmCollectionChange = async () => {
    if (!selectedSite) return;
    if (selectedCollectionId) {
      await api.addToCollection(selectedSite.id, selectedCollectionId);
    } else {
      await api.removeFromCollection(selectedSite.id);
    }
    await Promise.all([refreshSitesPageZero(), collectionsQuery.refresh()]);
    setCollectionModalOpen(false);
    setSelectedSite(null);
    setSelectedCollectionId(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title={`Мої сайти (${displayedSites.length})`} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук сайтів..."
            className="w-full h-10 pl-10 pr-4 rounded-[10px] border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative min-w-[240px]">
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "date" | "name" | "edited")
            }
            className="w-full h-10 px-3 rounded-[10px] border border-zinc-200 bg-white text-sm text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => {
            void refreshSitesPageZero();
          }}
          disabled={isRefreshingSites || isLoadingNextPage}
          className="flex items-center gap-2 h-10 px-4 border border-zinc-200 text-zinc-700 rounded-[10px] hover:bg-zinc-50 transition-colors duration-200 active:scale-[0.98] font-medium text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshingSites ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          type="button"
          onClick={() => setCreateSheetOpen(true)}
          className="flex items-center gap-2 h-10 px-4 min-w-[140px] bg-blue-600 text-white rounded-[10px] hover:bg-blue-700 transition-colors duration-200 active:scale-[0.98] font-medium text-sm"
        >
          <Plus className="w-5 h-5" />
          Створити сайт
        </button>
      </div>

      {sitesStatus === "error" ? (
        <div className="text-sm text-red-600">{sitesError}</div>
      ) : null}

      <div className="space-y-4">
        {displayedSites.map((site) => {
          const collection = site.collectionId
            ? collectionsById.get(site.collectionId)
            : null;
          const collectionTone = collection ? toneClasses[collection.color] : null;

          return (
            <div
              key={site.id}
              className="relative bg-white rounded-xl border border-zinc-200 p-4 h-[232px] flex gap-4 hover:shadow-lg transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => openOverview(site.id)}
                className="w-[420px] h-[200px] rounded-[10px] bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-left hover:bg-zinc-200/70 transition-colors"
              >
                <div className="text-center text-zinc-400">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-zinc-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-500">
                      {site.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm px-4">{site.name}</p>
                </div>
              </button>

              <div className="flex-1 flex flex-col">
                <button
                  type="button"
                  onClick={() => openOverview(site.id)}
                  className="mb-1 w-fit max-w-full truncate text-[18px] font-semibold text-zinc-900 hover:text-blue-700 transition-colors"
                >
                  {site.name}
                </button>

                {site.domain ? (
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2 w-fit"
                  >
                    {site.domain}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-sm text-zinc-500 mb-2">Домен не налаштовано</p>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center h-[22px] px-2.5 rounded-md bg-zinc-100 text-zinc-700 text-[12px] font-medium">
                    {site.type === "ecosystem" && site.ecosystemName
                      ? `Ecosystem: ${site.ecosystemName}`
                      : "Standalone"}
                  </span>
                  {collection && collectionTone ? (
                    <span
                      className={`inline-flex items-center h-[22px] px-2.5 rounded-md text-[12px] font-medium ${collectionTone.badgeBg} ${collectionTone.badgeText}`}
                    >
                      {collection.name}
                    </span>
                  ) : null}
                  <span className="text-xs text-zinc-500">
                    Оновлено {formatDate(site.updatedAt)}
                  </span>
                </div>

                <div className="flex-1" />

                <div className="flex gap-2">
                  <button
                    onClick={() => openBuilder(site.id)}
                    className="h-10 px-4 min-w-[160px] bg-blue-600 text-white rounded-[10px] hover:bg-blue-700 transition-colors text-sm font-medium active:scale-[0.98]"
                  >
                    Редагувати сайт
                  </button>
                  <button
                    onClick={() => openOverview(site.id)}
                    className="h-10 px-4 min-w-[160px] border border-zinc-200 text-zinc-700 rounded-[10px] hover:bg-zinc-50 transition-colors text-sm font-medium active:scale-[0.98]"
                  >
                    Налаштування
                  </button>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === site.id ? null : site.id)
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors active:scale-[0.98]"
                >
                  <MoreVertical className="w-5 h-5 text-zinc-600" />
                </button>

                {openMenuId === site.id ? (
                  <>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="fixed inset-0 z-30 bg-transparent"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-40">
                      <button
                        onClick={() => handleMenuAction("edit", site)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Редагувати
                      </button>
                      <button
                        onClick={() => handleMenuAction("settings", site)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Налаштування
                      </button>
                      <button
                        onClick={() => handleMenuAction("duplicate", site)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Дублювати
                      </button>
                      <button
                        onClick={() => handleMenuAction("collection", site)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <FolderInput className="w-4 h-4" />
                        Колекції
                      </button>
                      <button
                        onClick={() => handleMenuAction("delete", site)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Видалити
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {isLoadingNextPage ? (
        <div className="mt-4 text-sm text-zinc-500">Завантаження...</div>
      ) : null}

      {hasNextPage ? <div ref={loadMoreSentinelRef} className="h-2" /> : null}

      <ConfirmationDialog
        open={deleteModalOpen}
        title="Перемістити сайт у кошик?"
        description={
          selectedSite
            ? `Сайт "${selectedSite.name}" буде переміщено у кошик.`
            : undefined
        }
        confirmLabel="Перемістити"
        tone="danger"
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedSite(null);
        }}
        onConfirm={confirmDelete}
      />

      <CreateSiteSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={handleSiteCreated}
      />

      {collectionModalOpen ? (
        <>
          <button
            type="button"
            aria-label="Close collection modal"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCollectionModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                Колекції
              </h2>
              <p className="text-zinc-600 mb-4">
                Оберіть колекцію для вибраного сайту.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-zinc-700">
                  <input
                    type="radio"
                    checked={!selectedCollectionId}
                    onChange={() => setSelectedCollectionId(null)}
                  />
                  <span>Без колекції</span>
                </label>
                {(collectionsQuery.data?.items ?? []).map((collection) => (
                  <label
                    key={collection.id}
                    className="flex items-center gap-3 text-sm text-zinc-700"
                  >
                    <input
                      type="radio"
                      checked={selectedCollectionId === collection.id}
                      onChange={() => setSelectedCollectionId(collection.id)}
                    />
                    <span>{collection.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={closeCollectionModal}
                  className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium"
                >
                  Скасувати
                </button>
                <button
                  onClick={confirmCollectionChange}
                  className="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium active:scale-[0.98]"
                >
                  Зберегти
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
