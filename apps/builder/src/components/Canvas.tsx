import { PageNode } from "../renderer/nodeComponents/PageNode";
import { useBuilderStore } from "../state/builderStore";

export const Canvas = () => {
  const {
    state: { editor },
  } = useBuilderStore();

  const canvasWidth =
    editor.activeBreakpoint === "desktop"
      ? "w-full"
      : editor.activeBreakpoint === "tablet"
      ? "w-[768px]"
      : "w-[375px]";

  return (
    <div className="flex-1 overflow-auto bg-zinc-50 p-6">
      <div className={`mx-auto transition-all duration-300 ${canvasWidth}`}>
        <PageNode>
          <div className="border border-dashed border-zinc-300 rounded-2xl bg-white px-8 py-16 text-center text-sm text-zinc-500">
            Empty page
          </div>
        </PageNode>
      </div>
    </div>
  );
};
