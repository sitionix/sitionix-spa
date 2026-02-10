import { PageNode } from "../../renderer/nodeComponents/PageNode";
import { useBuilderStore } from "../../application/builderStore";
import { EmptyState } from "../patterns/EmptyState";

export const Canvas = () => {
  const {
    state: { editor },
    derived,
    actions,
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

  if (!derived.hasPages) {
    return (
      <div className="flex-1 overflow-auto bg-zinc-50 p-6">
        <div className="h-full flex items-center justify-center">
          <EmptyState
            title="No pages yet"
            subtitle="Create your first page to start building."
            className="max-w-md text-center space-y-4"
            titleClassName="text-lg font-semibold text-zinc-900"
            subtitleClassName="text-sm text-zinc-500"
            action={
              <button
                type="button"
                onClick={actions.openCreatePageModal}
                className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Add new page
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const document = derived.activeDocument;
  const rootNode = document?.nodes?.[document.rootId];
  const isEmptyPage = !rootNode?.children || rootNode.children.length === 0;

  return (
    <div className="flex-1 overflow-auto bg-zinc-50 p-6">
      <div className={`mx-auto transition-all duration-300 ${canvasWidth}`}>
        <PageNode>
          {isEmptyPage ? (
            <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-zinc-300 rounded-2xl bg-white px-8 py-16 text-center">
              <EmptyState
                title="This page is empty"
                subtitle="Add a section to start building."
                className="text-center space-y-4"
                titleClassName="text-base font-semibold text-zinc-900"
                subtitleClassName="text-sm text-zinc-500"
                action={
                  <button
                    type="button"
                    disabled
                    className="h-10 px-6 rounded-lg bg-zinc-200 text-zinc-500 text-sm font-semibold cursor-not-allowed"
                  >
                    Add section
                  </button>
                }
              />
            </div>
          ) : null}
        </PageNode>
      </div>
    </div>
  );
};
