import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Eye, Users, Clock } from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDuration } from "../../model/formatters";
import { toneClasses, type Tone } from "../colorTokens";

const trafficTones: Tone[] = ["blue", "green", "purple", "orange"];

export function CRMPage() {
  const navigate = useNavigate();
  const api = useWorkspaceApi();
  const { data, status, error, refresh } = useWorkspaceQuery(
    () => api.getCrmSummary(),
    [api]
  );

  if (status === "error") {
    return (
      <div className="max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до Dashboard
        </button>
        <div className="text-sm text-red-600">
          {error}
          <button
            onClick={refresh}
            className="ml-3 text-blue-600 hover:text-blue-700"
          >
            Спробувати ще раз
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="text-sm text-zinc-500">Завантаження аналітики...</div>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до Dashboard
        </button>
        <h1 className="text-[32px] font-bold text-zinc-900 mb-2">
          CRM Аналітика
        </h1>
        <p className="text-zinc-600">
          Детальна статистика по всім вашим сайтам
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +{overview.totalViewsChangePct}%
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            {overview.totalViews.toLocaleString("uk-UA")}
          </div>
          <div className="text-sm text-zinc-600">Всього переглядів</div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +{overview.averageViewsChangePct}%
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            {overview.averageViewsPerSite.toLocaleString("uk-UA")}
          </div>
          <div className="text-sm text-zinc-600">Середньо на сайт</div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +{overview.uniqueVisitorsChangePct}%
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            {overview.uniqueVisitors.toLocaleString("uk-UA")}
          </div>
          <div className="text-sm text-zinc-600">
            Унікальних відвідувачів
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            {formatDuration(overview.averageSessionDurationSeconds)}
          </div>
          <div className="text-sm text-zinc-600">Середній час на сайті</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900">
            Продуктивність сайтів
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Сайт
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Домен
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Переглядів
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Унікальних
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Bounce Rate
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-900">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.sitePerformance.map((site) => (
                <tr key={site.siteId} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900">
                      {site.siteName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-blue-600">{site.domain}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">
                      {site.views.toLocaleString("uk-UA")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900">
                      {site.uniqueVisitors.toLocaleString("uk-UA")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`${
                        site.bounceRatePct < 50 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {site.bounceRatePct}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        site.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {site.status === "published" ? "Активний" : "Чернетка"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">
            Джерела трафіку
          </h3>
          <div className="space-y-4">
            {data.trafficSources.map((item, index) => {
              const tone = toneClasses[trafficTones[index % trafficTones.length]];
              return (
                <div key={item.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-700">{item.source}</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {item.visits.toLocaleString("uk-UA")} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tone.solidBg} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">Топ сторінки</h3>
          <div className="space-y-4">
            {data.topPages.map((item, index) => (
              <div key={item.path} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-medium text-zinc-600">
                    {index + 1}
                  </div>
                  <span className="text-sm text-zinc-700 font-mono">
                    {item.path}
                  </span>
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {item.views.toLocaleString("uk-UA")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
