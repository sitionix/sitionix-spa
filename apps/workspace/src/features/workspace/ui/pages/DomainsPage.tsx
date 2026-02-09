import { Link2, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDate } from "../../model/formatters";
import { PageHeader } from "../components/PageHeader";

export function DomainsPage() {
  const api = useWorkspaceApi();
  const { data, status, error, refresh } = useWorkspaceQuery(
    () => api.getDomains(),
    [api]
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Домени"
        subtitle="Керуйте доменними іменами ваших сайтів"
        actions={
          <button className="flex items-center gap-2 h-11 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 active:scale-[0.98] font-medium">
            <Plus className="w-5 h-5" />
            Додати домен
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

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {(data?.items ?? []).map((domain) => (
            <div
              key={domain.id}
              className="p-6 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      {domain.domain}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Діє до: {formatDate(domain.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.status === "active" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Активний
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        Очікує
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
