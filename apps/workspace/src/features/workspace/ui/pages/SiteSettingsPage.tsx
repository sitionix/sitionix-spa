import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  X,
  Zap,
} from "lucide-react";
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

type SiteOverviewTab = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type SiteOverviewStatusCardProps = {
  title: string;
  status: string;
  description: string;
};

type SiteOverviewActionItemProps = {
  title: string;
  description: string;
  reason: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
};

type SiteOverviewChecklistItemProps = {
  label: string;
  completed: boolean;
};

function SiteOverviewStatusCard({
  title,
  status,
  description,
}: Readonly<SiteOverviewStatusCardProps>) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-1 text-sm text-zinc-500">{title}</div>
      <div className="mb-1 text-sm font-semibold text-zinc-900">{status}</div>
      <div className="text-xs text-zinc-600">{description}</div>
    </div>
  );
}

function SiteOverviewActionItem({
  title,
  description,
  reason,
  actionLabel,
  onAction,
  disabled = false,
}: Readonly<SiteOverviewActionItemProps>) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="mb-1 text-sm font-semibold text-zinc-900">{title}</h4>
          <p className="mb-1 text-sm text-zinc-600">{description}</p>
          <p className="text-xs text-zinc-500">{reason}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SiteOverviewChecklistItem({
  label,
  completed,
}: Readonly<SiteOverviewChecklistItemProps>) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
          completed ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
        }`}
      >
        {completed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </div>
      <span className={`text-sm ${completed ? "text-zinc-700" : "text-zinc-500"}`}>
        {label}
      </span>
    </div>
  );
}

export function SiteSettingsPage() {
  const { siteId } = useParams();
  const api = useWorkspaceApi();
  const openBuilder = () => {
    if (!siteId) {
      return;
    }
    navigateHost(`/builder/${siteId}`);
  };

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

  const publishingStatus =
    data.status === "published" ? "Опублікований" : "Ще не опублікований";
  const publishingDescription =
    data.status === "published"
      ? "Сайт уже доступний після останньої публікації"
      : "Сайт створено, але ще не був опублікований";
  const contentStatus = data.description?.trim()
    ? "Базовий контент задано"
    : "Потрібно доповнити";
  const contentDescription = data.description?.trim()
    ? "Є опис сайту у workspace overview"
    : "Опис поки відсутній у поточному overview";
  const hasDescription = Boolean(data.description?.trim());
  const isPublished = data.status === "published";
  const hasOverviewUpdate = data.updatedAt !== data.createdAt;
  const readinessItems = [
    {
      label: "Заповнено базовий опис сайту",
      completed: hasDescription,
    },
    {
      label: "Сайт опубліковано",
      completed: isPublished,
    },
    {
      label: "Підключено домен",
      completed: false,
    },
    {
      label: "Є SEO-дані",
      completed: false,
    },
    {
      label: "Є структура сторінок",
      completed: false,
    },
  ];
  const nextSteps = [
    {
      title: "Відкрити білдер",
      description: "Перейдіть до редагування контенту сайту",
      reason: "Це основна наступна дія, яка вже підтримується UI",
      actionLabel: "Відкрити",
      onAction: openBuilder,
      disabled: false,
    },
    {
      title: "Додати базовий опис",
      description: "Overview зараз показує порожній опис",
      reason: "Без опису сторінка виглядає неповною",
      actionLabel: "У білдер",
      onAction: openBuilder,
      disabled: hasDescription,
    },
    {
      title: "Підготувати публікацію",
      description:
        isPublished
          ? "Сайт уже опублікований і доступний для перегляду"
          : "Додайте контент у білдері та підготуйте сайт до першої публікації",
      reason:
        isPublished
          ? "Можна повертатися до редагування, коли з’являться нові зміни"
          : "Поточний overview показує, що сайт ще не в published стані",
      actionLabel: "Відкрити",
      onAction: openBuilder,
      disabled: false,
    },
  ];
  const recentChanges = [
    {
      action: "Створено сайт",
      time: formatDate(data.createdAt),
    },
    ...(hasOverviewUpdate
      ? [
          {
            action: "Останнє оновлення overview",
            time: formatDate(data.updatedAt),
          },
        ]
      : []),
  ];
  const attentionItems = [
    hasDescription ? null : "В описі сайту ще немає контенту",
    isPublished ? null : "Сайт ще не опубліковано",
    "Домен і SEO-поля ще не приходять у поточний overview API",
  ].filter((item): item is string => Boolean(item));
  const tabs: SiteOverviewTab[] = [
    { label: "Огляд", active: true },
    { label: "Сторінки", disabled: true },
    { label: "Білдер", onClick: openBuilder },
    { label: "Домени", disabled: true },
    { label: "Публікація", disabled: true },
    { label: "Аналітика", disabled: true },
    { label: "Налаштування", disabled: true },
  ];

  const statusBadgeClassName = isPublished
    ? "bg-emerald-100 text-emerald-700"
    : "bg-zinc-100 text-zinc-700";
  const readinessLabel = isPublished ? "Опубліковано" : "У процесі";
  const statusDotClassName = isPublished ? "bg-emerald-500" : "bg-zinc-400";

  return (
    <div className="-mx-6 -mt-6 min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <button
                onClick={() => navigateHost("/workspace/sites")}
                className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад до сайтів
              </button>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="truncate text-3xl font-semibold text-zinc-900">
                  {data.name}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClassName}`}
                >
                  {statusLabel[data.status]}
                </span>
              </div>
              <p className="text-sm text-zinc-600">
                {typeLabel[data.type]} · Оновлено {formatDate(data.updatedAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openBuilder}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Zap className="h-4 w-4" />
                Відкрити білдер
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6">
          <nav className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => {
              const tabClassName = tab.active
                ? "border-blue-600 text-blue-600"
                : tab.disabled
                ? "border-transparent text-zinc-400"
                : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900";

              return (
                <button
                  key={tab.label}
                  type="button"
                  disabled={tab.disabled}
                  onClick={tab.onClick}
                  className={`border-b-2 py-4 text-sm font-medium transition-colors ${tabClassName}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SiteOverviewStatusCard
              title="Контент"
              status={contentStatus}
              description={contentDescription}
            />
            <SiteOverviewStatusCard
              title="Статус"
              status={statusLabel[data.status]}
              description={publishingDescription}
            />
            <SiteOverviewStatusCard
              title="Тип сайту"
              status={typeLabel[data.type]}
              description="Поточний формат сайту з workspace overview"
            />
            <SiteOverviewStatusCard
              title="Оновлення"
              status={formatDate(data.updatedAt)}
              description="Остання зміна, яку зараз віддає backend overview"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900">Що далі</h2>
              <div className="space-y-3">
                {nextSteps.map((item) => (
                  <SiteOverviewActionItem
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    reason={item.reason}
                    actionLabel={item.actionLabel}
                    onAction={item.onAction}
                    disabled={item.disabled}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-2 text-xl font-semibold text-zinc-900">Готовність сайту</h2>
              <div className="mb-4">
                <div className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {readinessLabel}
                </div>
                <p className="text-sm text-zinc-600">
                  Цей блок побудований на реальних даних overview. Пункти без backend
                  контракту позначені як незавершені.
                </p>
              </div>
              <div className="space-y-1">
                {readinessItems.map((item) => (
                  <SiteOverviewChecklistItem
                    key={item.label}
                    label={item.label}
                    completed={item.completed}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-900">Основна інформація</h2>
                <span className="text-sm text-zinc-500">Site ID: {data.siteId}</span>
              </div>
              <dl className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Назва
                  </dt>
                  <dd className="text-sm font-medium text-zinc-900">{data.name}</dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Тип
                  </dt>
                  <dd className="text-sm font-medium text-zinc-900">{typeLabel[data.type]}</dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Статус
                  </dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {statusLabel[data.status]}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Створено
                  </dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {formatDate(data.createdAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900">Останні зміни</h2>
              <div className="space-y-3">
                {recentChanges.map((change) => (
                  <div key={`${change.action}-${change.time}`} className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-900">{change.action}</p>
                      <p className="text-xs text-zinc-500">{change.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900">Опис</h2>
              <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
                {data.description?.trim() || "Опис відсутній"}
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:col-span-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-base font-semibold text-zinc-900">Швидкі дії</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openBuilder}
                  className="flex w-full items-center gap-2 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  <Zap className="h-4 w-4" />
                  Відкрити білдер
                </button>
                <button
                  type="button"
                  onClick={() => navigateHost("/workspace/sites")}
                  className="flex w-full items-center gap-2 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  До списку сайтів
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-3 text-base font-semibold text-zinc-900">Статус публікації</h3>
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${statusDotClassName}`}
                  />
                  <span className="text-sm font-medium text-zinc-900">
                    {publishingStatus}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{publishingDescription}</p>
              </div>
              <button
                type="button"
                onClick={openBuilder}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Відкрити білдер
              </button>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-3 text-base font-semibold text-zinc-900">Потребує уваги</h3>
              {attentionItems.length > 0 ? (
                <div className="space-y-2">
                  {attentionItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p className="text-sm text-zinc-700">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Критичних незаповнених базових полів у поточному overview не видно.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
