import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import type { WorkspaceCollection, WorkspaceSite } from "@sitionix/contracts";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDate } from "../../model/formatters";
import { PageHeader } from "../components/PageHeader";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { CreateSiteSheet } from "../components/CreateSiteSheet";
import { toneClasses } from "../colorTokens";

type MenuAction =
  | "edit"
  | "settings"
  | "rename"
  | "duplicate"
  | "collection"
  | "delete";

const sortLabels: Record<string, string> = {
  date: "Дата створення",
  name: "Назва",
  edited: "Останнє редагування",
};

export function SitesPage() {
  const api = useWorkspaceApi();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "edited">("date");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<WorkspaceSite | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const sitesQuery = useWorkspaceQuery(
    () => api.getSites({ search, sortBy }),
    [api, search, sortBy]
  );
  const collectionsQuery = useWorkspaceQuery(
    () => api.getCollections(),
    [api]
  );

  const collectionsById = useMemo(() => {
    const map = new Map<string, WorkspaceCollection>();
    collectionsQuery.data?.items.forEach((collection) => {
      map.set(collection.id, collection);
    });
    return map;
  }, [collectionsQuery.data]);

  const handleMenuAction = (action: MenuAction, site: WorkspaceSite) => {
    setOpenMenuId(null);
    setSelectedSite(site);

    switch (action) {
      case "edit":
        navigate(`/editor/${site.id}`);
        break;
      case "settings":
        navigate(`/sites/${site.id}/settings`);
        break;
      case "rename":
        setNewName(site.name);
        setRenameModalOpen(true);
        break;
      case "duplicate":
        api.duplicateSite(site.id).then(() => sitesQuery.refresh());
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
    await sitesQuery.refresh();
    setDeleteModalOpen(false);
    setSelectedSite(null);
  };

  const closeRenameModal = () => {
    setRenameModalOpen(false);
    setSelectedSite(null);
    setNewName("");
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
  };

  const confirmRename = async () => {
    if (!selectedSite || !newName.trim()) return;
    await api.updateSite(selectedSite.id, { name: newName.trim() });
    await sitesQuery.refresh();
    setRenameModalOpen(false);
    setSelectedSite(null);
    setNewName("");
  };

  const confirmCollectionChange = async () => {
    if (!selectedSite) return;
    if (selectedCollectionId) {
      await api.addToCollection(selectedSite.id, selectedCollectionId);
    } else {
      await api.removeFromCollection(selectedSite.id);
    }
    await Promise.all([sitesQuery.refresh(), collectionsQuery.refresh()]);
    setCollectionModalOpen(false);
    setSelectedSite(null);
    setSelectedCollectionId(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title={`Мої сайти (${sitesQuery.data?.meta.totalItems ?? 0})`} />

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
          onClick={() => setCreateSheetOpen(true)}
          className="flex items-center gap-2 h-10 px-4 min-w-[140px] bg-blue-600 text-white rounded-[10px] hover:bg-blue-700 transition-colors duration-200 active:scale-[0.98] font-medium text-sm"
        >
          <Plus className="w-5 h-5" />
          Створити сайт
        </button>
      </div>

      {sitesQuery.status === "error" ? (
        <div className="text-sm text-red-600">{sitesQuery.error}</div>
      ) : null}

      <div className="space-y-4">
        {(sitesQuery.data?.items ?? []).map((site) => {
          const collection = site.collectionId
            ? collectionsById.get(site.collectionId)
            : null;
          const collectionTone = collection ? toneClasses[collection.color] : null;

          return (
            <div
              key={site.id}
              className="relative bg-white rounded-xl border border-zinc-200 p-4 h-[232px] flex gap-4 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-[420px] h-[200px] rounded-[10px] bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <div className="text-center text-zinc-400">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-zinc-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-500">
                      {site.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm px-4">{site.name}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="text-[18px] font-semibold text-zinc-900 mb-1 truncate">
                  {site.name}
                </h3>

                <a
                  href={`https://${site.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2 w-fit"
                >
                  {site.domain}
                  <ExternalLink className="w-4 h-4" />
                </a>

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
                    onClick={() => navigate(`/editor/${site.id}`)}
                    className="h-10 px-4 min-w-[160px] bg-blue-600 text-white rounded-[10px] hover:bg-blue-700 transition-colors text-sm font-medium active:scale-[0.98]"
                  >
                    Редагувати сайт
                  </button>
                  <button
                    onClick={() => navigate(`/sites/${site.id}/settings`)}
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
                        onClick={() => handleMenuAction("rename", site)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Перейменувати
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

      {renameModalOpen ? (
        <>
          <button
            type="button"
            aria-label="Close rename modal"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeRenameModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                Перейменувати сайт
              </h2>
              <p className="text-zinc-600 mb-4">
                Вкажіть нову назву для вибраного сайту.
              </p>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={closeRenameModal}
                  className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium"
                >
                  Скасувати
                </button>
                <button
                  onClick={confirmRename}
                  className="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium active:scale-[0.98]"
                >
                  Зберегти
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

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
