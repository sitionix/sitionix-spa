import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Undo,
  Redo,
} from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";

type ViewMode = "desktop" | "tablet" | "mobile";

export function SiteEditorPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const api = useWorkspaceApi();
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const { data, status, error } = useWorkspaceQuery(
    () =>
      siteId
        ? Promise.all([api.getSiteOverview(siteId), api.getEditorData(siteId)]).then(
            ([overview, editor]) => ({ overview, editor })
          )
        : Promise.reject(new Error("Missing site")),
    [api, siteId]
  );

  if (status === "error") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Сайт не знайдено
          </h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/sites")}
            className="text-blue-600 hover:text-blue-700"
          >
            Повернутися до списку сайтів
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-500">
        Завантаження редактора...
      </div>
    );
  }

  const { overview, editor } = data;
  const siteTypeLabel = overview.type === "ecosystem" ? "Ecosystem" : "Standalone";
  const siteStatusLabel = overview.status === "published" ? "Опублікований" : "Чернетка";

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <div className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/sites")}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="h-6 w-px bg-zinc-200" />
          <div>
            <h1 className="font-semibold text-zinc-900">{overview.name}</h1>
            <p className="text-xs text-zinc-500">
              {siteTypeLabel} · {siteStatusLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <Undo className="w-4 h-4 text-zinc-600" />
          </button>
          <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <Redo className="w-4 h-4 text-zinc-600" />
          </button>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
            <button
              onClick={() => setViewMode("desktop")}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === "desktop"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("tablet")}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === "tablet"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === "mobile"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          <button className="flex items-center gap-2 h-10 px-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium">
            <Eye className="w-4 h-4" />
            Попередній перегляд
          </button>

          <button className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Save className="w-4 h-4" />
            Зберегти
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div
          className={`bg-white shadow-2xl transition-all duration-300 ${
            viewMode === "desktop"
              ? "w-full h-full"
              : viewMode === "tablet"
              ? "w-[768px] h-[1024px]"
              : "w-[375px] h-[667px]"
          }`}
        >
          <div className="w-full h-full flex flex-col">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center px-8">
              <div className="text-white text-2xl font-bold">{overview.name}</div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-zinc-900 mb-4">
                  {editor.preview.heroTitle}
                </h1>
                <p className="text-lg text-zinc-600 mb-8">
                  {editor.preview.heroSubtitle}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {editor.preview.blocks.map((block) => (
                    <div key={block.id} className="p-6 bg-zinc-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4" />
                      <h3 className="font-semibold text-zinc-900 mb-2">
                        {block.title}
                      </h3>
                      <p className="text-sm text-zinc-600">
                        {block.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    {editor.preview.ctaLabel}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-16 bg-zinc-900 flex items-center justify-center">
              <p className="text-zinc-400 text-sm">
                {editor.preview.footerText}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-900 mb-4">Компоненти</h3>
        <div className="space-y-2">
          {editor.palette.map((component) => (
            <div
              key={component.id}
              className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors text-sm"
            >
              {component.label}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed right-0 top-16 bottom-0 w-64 bg-white border-l border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-900 mb-4">Властивості</h3>
        <div className="text-sm text-zinc-500">
          Виберіть елемент для редагування
        </div>
      </div>
    </div>
  );
}
