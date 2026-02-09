import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useWorkspaceApi } from "../../api/WorkspaceApiProvider";
import { useWorkspaceQuery } from "../../model/useWorkspaceQuery";

export function SiteSettingsPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const api = useWorkspaceApi();

  const { data, status, error } = useWorkspaceQuery(
    () =>
      siteId ? api.getSite(siteId) : Promise.reject(new Error("Missing site")),
    [api, siteId]
  );

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setDomain(data.domain);
    setDescription(data.description ?? "");
    setSeoTitle(data.seoTitle ?? "");
    setSeoDescription(data.seoDescription ?? "");
  }, [data]);

  const handleSave = async () => {
    if (!siteId) return;
    await api.updateSite(siteId, {
      name,
      domain,
      description,
      seoTitle,
      seoDescription,
    });
    navigate("/sites");
  };

  if (status === "error") {
    return (
      <div className="max-w-[800px] mx-auto">
        <button
          onClick={() => navigate("/sites")}
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
          onClick={() => navigate("/sites")}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до сайтів
        </button>
        <h1 className="text-[32px] font-bold text-zinc-900 mb-2">
          Налаштування сайту
        </h1>
        <p className="text-zinc-600">
          Оновіть інформацію та SEO параметри вашого сайту
        </p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Основна інформація
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Назва сайту
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Введіть назву сайту"
              />
            </div>

            <div>
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Домен
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example.com"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Опис сайту
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Короткий опис вашого сайту"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            SEO налаштування
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="seoTitle"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                SEO заголовок
              </label>
              <input
                id="seoTitle"
                type="text"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Заголовок для пошукових систем"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Рекомендована довжина: 50-60 символів
              </p>
            </div>

            <div>
              <label
                htmlFor="seoDescription"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                SEO опис
              </label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Опис сайту для пошукових систем"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Рекомендована довжина: 150-160 символів
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 flex gap-3 justify-end">
          <button
            onClick={() => navigate("/sites")}
            className="h-12 px-6 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 h-12 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Зберегти зміни
          </button>
        </div>
      </div>
    </div>
  );
}
