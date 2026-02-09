import { FolderOpen, Plus } from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { PageHeader } from "../components/PageHeader";
import { toneClasses } from "../colorTokens";

export function CollectionsPage() {
  const api = useWorkspaceApi();
  const { data, status, error, refresh } = useWorkspaceQuery(
    () => api.getCollections(),
    [api]
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Колекції"
        subtitle="Організуйте свої сайти у колекції"
        actions={
          <button className="flex items-center gap-2 h-11 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 active:scale-[0.98] font-medium">
            <Plus className="w-5 h-5" />
            Створити колекцію
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data?.items ?? []).map((collection) => {
          const tone = toneClasses[collection.color];
          return (
            <div
              key={collection.id}
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-xl ${tone.softBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <FolderOpen className={`w-8 h-8 ${tone.text}`} />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                {collection.name}
              </h3>
              <p className="text-sm text-zinc-600">
                {collection.sitesCount} сайтів
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
