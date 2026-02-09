import { Trash2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDateTime } from "../../model/formatters";
import { PageHeader } from "../components/PageHeader";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { EmptyState } from "../components/EmptyState";

export function TrashPage() {
  const api = useWorkspaceApi();
  const { data, status, error, refresh } = useWorkspaceQuery(
    () => api.getTrash(),
    [api]
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [clearAllModal, setClearAllModal] = useState(false);

  const trashItems = data?.items ?? [];

  if (status === "loading" && !data) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <PageHeader title="Кошик" subtitle="Завантаження..." />
      </div>
    );
  }

  const handleRestore = async (id: string) => {
    await api.restoreSite(id);
    await refresh();
  };

  const handlePermanentDelete = async (id: string) => {
    await api.permanentlyDeleteSite(id);
    await refresh();
    setConfirmDeleteId(null);
  };

  const handleClearAll = async () => {
    await api.clearTrash();
    await refresh();
    setClearAllModal(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title={`Кошик (${data?.meta.totalItems ?? 0})`}
        subtitle="Видалені елементи зберігаються 30 днів"
        actions={
          trashItems.length > 0 ? (
            <button
              onClick={() => setClearAllModal(true)}
              className="flex items-center gap-2 h-10 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 active:scale-[0.98] font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Очистити кошик
            </button>
          ) : null
        }
      />

      {status === "error" ? (
        <div className="text-sm text-red-600">
          {error}
          <button
            onClick={refresh}
            className="ml-3 text-blue-600 hover:text-blue-700"
          >
            Спробувати ще раз
          </button>
        </div>
      ) : null}

      {trashItems.length > 0 ? (
        <div className="space-y-4">
          {trashItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {item.domain} • Видалено {formatDateTime(item.deletedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="flex items-center gap-2 h-10 px-4 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Відновити
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="flex items-center gap-2 h-10 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    Видалити назавжди
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trash2}
          title="Кошик порожній"
          description="Тут з'являться видалені елементи"
        />
      )}

      <ConfirmationDialog
        open={confirmDeleteId !== null}
        title="Видалити назавжди?"
        description="Цю дію не можна буде скасувати. Сайт буде видалено назавжди."
        confirmLabel="Видалити назавжди"
        tone="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            void handlePermanentDelete(confirmDeleteId);
          }
        }}
      />

      <ConfirmationDialog
        open={clearAllModal}
        title="Очистити кошик?"
        description={`Всі елементи в кошику (${trashItems.length}) будуть видалені назавжди.`}
        confirmLabel="Очистити кошик"
        tone="danger"
        onCancel={() => setClearAllModal(false)}
        onConfirm={handleClearAll}
      />
    </div>
  );
}
