import { useEffect } from "react";
import { X } from "lucide-react";
import { useBuilderStore } from "../../application/builderStore";
import { SiteRenderer } from "./SiteRenderer";

export const FullscreenPreview = () => {
  const {
    state: { editor },
    derived,
    actions,
  } = useBuilderStore();

  useEffect(() => {
    if (editor.mode !== "preview") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        actions.toggleMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor.mode, actions]);

  if (editor.mode !== "preview") return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <button
        type="button"
        onClick={actions.toggleMode}
        className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
        aria-label="Close preview"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="h-full overflow-y-auto">
        <SiteRenderer document={derived.activeDocument} />
      </div>
    </div>
  );
};
