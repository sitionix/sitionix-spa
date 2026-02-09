import { useNavigate } from "react-router-dom";
import {
  Globe,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";
import { formatDate } from "../../model/formatters";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";

export function DashboardPage() {
  const api = useWorkspaceApi();
  const navigate = useNavigate();
  const { data, status, error, refresh } = useWorkspaceQuery(
    () => api.getDashboardSummary(),
    [api]
  );

  if (status === "error") {
    return (
      <div className="max-w-[1400px] mx-auto">
        <PageHeader
          title="Dashboard"
          subtitle="Не вдалося завантажити дані"
          actions={
            <button
              onClick={refresh}
              className="h-10 px-4 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors text-sm font-medium"
            >
              Спробувати ще раз
            </button>
          }
        />
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <PageHeader title="Dashboard" subtitle="Завантаження..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-[120px] bg-white rounded-xl border border-zinc-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Всього сайтів",
      value: data.totalSites,
      icon: Globe,
      tone: "blue" as const,
    },
    {
      label: "Опубліковано",
      value: data.publishedSites,
      icon: TrendingUp,
      tone: "green" as const,
    },
    {
      label: "Всього відвідувань",
      value: data.totalVisits.toLocaleString("uk-UA"),
      icon: Eye,
      tone: "purple" as const,
    },
    {
      label: "Активних користувачів",
      value: data.activeUsers.toLocaleString("uk-UA"),
      icon: Users,
      tone: "orange" as const,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Вітаємо в Sitionix CRM"
        subtitle="Керуйте вашими сайтами та відстежуйте аналітику в одному місці"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate("/sites")}
          className="text-left bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white cursor-pointer hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <Globe className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Мої сайти</h3>
          <p className="text-blue-100">
            Переглядайте та керуйте всіма вашими веб-проектами
          </p>
        </button>

        <button
          onClick={() => navigate("/crm")}
          className="text-left bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white cursor-pointer hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <BarChart3 className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Аналітика CRM</h3>
          <p className="text-purple-100">
            Детальна статистика та звіти по вашим сайтам
          </p>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Останні сайти</h2>
          <button
            onClick={() => navigate("/sites")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Переглянути всі
          </button>
        </div>

        <div className="space-y-4">
          {data.recentSites.map((site) => (
            <button
              key={site.id}
              onClick={() => navigate("/sites")}
              className="w-full text-left flex items-center justify-between p-4 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{site.name}</h3>
                  <p className="text-sm text-zinc-500">{site.domain}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-zinc-900">
                  {site.visits.toLocaleString("uk-UA")} відвідувань
                </div>
                <div className="text-xs text-zinc-500">
                  {formatDate(site.updatedAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
