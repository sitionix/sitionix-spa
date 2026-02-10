import { PageNode } from "../renderer/nodeComponents/PageNode";
import { useBuilderStore } from "../state/builderStore";

export const Canvas = () => {
  const {
    state: { editor },
  } = useBuilderStore();

  const getCanvasWidth = (breakpoint: typeof editor.activeBreakpoint) => {
    switch (breakpoint) {
      case "tablet":
        return "w-[768px]";
      case "mobile":
        return "w-[375px]";
      case "desktop":
      default:
        return "w-full";
    }
  };
  const canvasWidth = getCanvasWidth(editor.activeBreakpoint);

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
