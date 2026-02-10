import { useBuilderStore } from "../../application/builderStore";

export const DeletePageModal = () => {
  const {
    state: { ui, site },
    actions,
  } = useBuilderStore();

  if (!ui.confirmDelete) return null;

  const page = site.pages[ui.confirmDelete.pageId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        role="presentation"
        onClick={actions.cancelDeletePage}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h3 className="text-base font-semibold text-zinc-900">Delete page</h3>
          <p className="text-sm text-zinc-500 mt-1">
            This action cannot be undone.
          </p>
        </div>
        <div className="px-6 py-5 space-y-2">
          <p className="text-sm text-zinc-700">
            You are about to delete:{" "}
            <span className="font-semibold text-zinc-900">
              {page?.name ?? "this page"}
            </span>
          </p>
          {page?.slug ? (
            <p className="text-xs text-zinc-500">{page.slug}</p>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={actions.cancelDeletePage}
            className="h-9 px-4 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={actions.confirmDeletePage}
            className="h-9 px-4 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
          >
            Delete page
          </button>
        </div>
      </div>
    </div>
  );
};
