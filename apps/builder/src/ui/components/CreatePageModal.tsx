import { useBuilderStore } from "../../application/builderStore";

export const CreatePageModal = () => {
  const {
    state: { ui },
    derived,
    actions,
  } = useBuilderStore();

  if (!ui.createPageModal.open) return null;

  const { createPageModal } = ui;
  const { createPage } = derived;

  const showNameError =
    !!createPage.nameError && (createPageModal.nameTouched || createPageModal.draftName.length > 0);
  const showSlugError =
    !!createPage.slugError &&
    (createPageModal.slugTouched || createPageModal.draftSlug.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={actions.closeCreatePageModal}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h3 className="text-base font-semibold text-zinc-900">New page</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Add a new page to your site.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Name
            </span>
            <input
              value={createPageModal.draftName}
              onChange={(event) => actions.updateCreatePageName(event.target.value)}
              onBlur={() =>
                actions.updateCreatePageName(createPageModal.draftName)
              }
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="About"
            />
            {showNameError ? (
              <p className="mt-2 text-xs text-rose-600">
                {createPage.nameError}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Slug / Path
            </span>
            <input
              value={createPageModal.draftSlug}
              onChange={(event) => actions.updateCreatePageSlug(event.target.value)}
              onBlur={() =>
                actions.updateCreatePageSlug(createPageModal.draftSlug)
              }
              disabled={createPageModal.isHome}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                createPageModal.isHome
                  ? "bg-zinc-100 text-zinc-400 border-zinc-200"
                  : "border-zinc-200"
              }`}
              placeholder="/about"
            />
            {showSlugError ? (
              <p className="mt-2 text-xs text-rose-600">{createPage.slugError}</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Format: /about</p>
            )}
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2">
            <input
              type="checkbox"
              aria-label="Set as home page"
              className="mt-1"
              checked={createPageModal.isHome}
              onChange={(event) => actions.toggleCreatePageHome(event.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Set as home page
              </span>
              <span className="block text-xs text-zinc-500">
                Home page always uses /.
              </span>
            </span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={actions.closeCreatePageModal}
            className="h-9 px-4 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={actions.submitCreatePage}
            disabled={!createPage.canSubmit}
            className={`h-9 px-4 rounded-lg text-sm font-semibold text-white transition-colors ${
              createPage.canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
