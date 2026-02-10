import { useEffect, useState } from "react";
import { Eye, Monitor, Save, Smartphone, Tablet, X } from "lucide-react";
import { useBuilderStore } from "../state/builderStore";
import { saveDraft } from "../state/storage";
import { navigateHost } from "../utils/navigateHost";

export const TopBar = ({ siteId }: { siteId: string }) => {
  const {
    state: { document, editor },
    actions,
  } = useBuilderStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = globalThis.setTimeout(() => setSaved(false), 2000);
    return () => globalThis.clearTimeout(timer);
  }, [saved]);

  const handleSave = () => {
    saveDraft(document);
    setSaved(true);
  };

  const handleExit = () => {
    navigateHost("/workspace/sites");
  };

  const title = siteId === "local" ? "New site" : `Site: ${siteId}`;

  return (
    <div className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm uppercase tracking-[0.2em] text-zinc-400">
            Builder
          </h1>
          <p className="text-base font-semibold text-zinc-900">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {saved ? (
          <span className="text-sm text-green-600 mr-2">Saved</span>
        ) : null}
        {editor.mode === "preview" ? (
          <span className="text-sm text-amber-600 mr-2">
            Preview mode: editing disabled
          </span>
        ) : null}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
          <button
            type="button"
            onClick={() => actions.setActiveBreakpoint("desktop")}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all ${
              editor.activeBreakpoint === "desktop"
                ? "bg-white shadow-sm text-blue-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
            <span className="text-xs font-medium">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => actions.setActiveBreakpoint("tablet")}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all ${
              editor.activeBreakpoint === "tablet"
                ? "bg-white shadow-sm text-blue-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
            <span className="text-xs font-medium">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => actions.setActiveBreakpoint("mobile")}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all ${
              editor.activeBreakpoint === "mobile"
                ? "bg-white shadow-sm text-blue-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-medium">Mobile</span>
          </button>
        </div>
        <button
          onClick={actions.toggleMode}
          className={`flex items-center gap-2 h-10 px-4 border rounded-lg transition-colors text-sm font-medium ${
            editor.mode === "preview"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleExit}
          className="flex items-center gap-2 h-10 px-4 border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Exit
        </button>
      </div>
    </div>
  );
};
