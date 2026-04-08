import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { navigateHost } from "../../../../shared/navigation/navigateHost";

const statusLabel: Record<"published" | "draft", string> = {
  published: "Опублікований",
  draft: "Чернетка",
};

const typeLabel: Record<"standalone" | "ecosystem", string> = {
  standalone: "Standalone",
  ecosystem: "Ecosystem",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function SiteSettingsPage() {
  const { siteId } = useParams();
  const api = useWorkspaceApi();

  const { data, status, error } = useWorkspaceQuery(
    () =>
      siteId ? api.getSiteOverview(siteId) : Promise.reject(new Error("Missing site")),
    [api, siteId]
  );

  if (status === "error") {
    return (
      <div className="max-w-[800px] mx-auto">
        <button
          onClick={() => navigateHost("/workspace/sites")}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до сайтів
        </button>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[800px] mx-auto">
        <div className="text-sm text-zinc-500">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigateHost("/workspace/sites")}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до сайтів
        </button>
        <h1 className="text-[32px] font-bold text-zinc-900 mb-2">
          Огляд сайту
        </h1>
        <p className="text-zinc-600">
          Базова інформація про сайт, яку зараз віддає workspace overview
        </p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Основна інформація
          </h2>

          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Назва сайту</dt>
              <dd className="text-base font-semibold text-zinc-900">{data.name}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Тип</dt>
              <dd className="text-base font-semibold text-zinc-900">
                {typeLabel[data.type]}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Статус</dt>
              <dd className="text-base font-semibold text-zinc-900">
                {statusLabel[data.status]}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Site ID</dt>
              <dd className="break-all text-sm text-zinc-900">{data.siteId}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Створено</dt>
              <dd className="text-base text-zinc-900">{formatDate(data.createdAt)}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dt className="text-sm font-medium text-zinc-500 mb-2">Оновлено</dt>
              <dd className="text-base text-zinc-900">{formatDate(data.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="pt-6 border-t border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Опис
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            {data.description?.trim() || "Опис відсутній"}
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 flex justify-end">
          <button
            onClick={() => navigateHost("/workspace/sites")}
            className="h-12 px-6 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium"
          >
            Повернутися до сайтів
          </button>
        </div>
      </div>
    </div>
  );
}
