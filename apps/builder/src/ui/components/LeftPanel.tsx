import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useBuilderStore } from "../../application/builderStore";
import { DependencyGate } from "../patterns/DependencyGate";
import { EmptyState } from "../patterns/EmptyState";

const TABS = [
  { key: "pages", label: "Pages" },
  { key: "components", label: "Components" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export const LeftPanel = () => {
  const {
    state: { site, ui },
    derived,
    actions,
  } = useBuilderStore();
  const [activeTab, setActiveTab] = useState<TabKey>("pages");

  const pages = useMemo(
    () =>
      site.pageOrder.map((pageId) => ({
        id: pageId,
        meta: site.pages[pageId],
      })),
    [site.pageOrder, site.pages]
  );

  const switchingDisabled = ui.confirmDelete !== null;

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="border-b border-zinc-200 px-4 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "pages" ? (
          <div className="space-y-3">
            <div className="flex items-center">
              <button
                type="button"
                onClick={actions.openCreatePageModal}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                + New page
              </button>
            </div>
            <div className="space-y-2">
              {pages.map(({ id, meta }) => {
                const isActive = id === derived.activePageId;
                const isRenaming = ui.inlineRename?.pageId === id;
                const renameError =
                  isRenaming && ui.inlineRename?.nameTouched
                    ? derived.inlineRename.nameError
                    : null;

                return (
                  <div
                    key={id}
                    className={`group relative rounded-xl border transition-colors ${
                      isActive
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                    } ${switchingDisabled ? "opacity-60" : ""}`}
                  >
                    {isRenaming ? (
                      <div className="px-3 py-2">
                        <input
                          value={ui.inlineRename?.draftName ?? ""}
                          onChange={(event) =>
                            actions.updateInlineRename(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              actions.commitInlineRename();
                            }
                            if (event.key === "Escape") {
                              actions.cancelInlineRename();
                            }
                          }}
                          onBlur={() => actions.commitInlineRename()}
                          autoFocus
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {renameError ? (
                          <p className="mt-2 text-xs text-rose-600">
                            {renameError}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={switchingDisabled ? -1 : 0}
                        aria-pressed={isActive}
                        aria-disabled={switchingDisabled}
                        onClick={() => {
                          if (switchingDisabled) return;
                          actions.setActivePage(id);
                        }}
                        onKeyDown={(event) => {
                          if (switchingDisabled) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            actions.setActivePage(id);
                          }
                        }}
                        className="w-full px-3 py-2 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex flex-col gap-1">
                            <span
                              className="truncate text-sm font-medium text-zinc-900"
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                actions.startInlineRename(id);
                              }}
                            >
                              {meta.name}
                            </span>
                            <div className="truncate text-xs text-zinc-500">
                              {meta.slug}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-none">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide ${
                                meta.isHome
                                  ? "text-blue-600"
                                  : "text-blue-600 opacity-0"
                              }`}
                              aria-hidden={!meta.isHome}
                            >
                              Home
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                actions.requestDeletePage(id);
                              }}
                              disabled={switchingDisabled}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100 disabled:opacity-0"
                              aria-label={`Delete ${meta.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Components</h3>
              <DependencyGate
                check={{ type: "REQUIRES_AT_LEAST_ONE_PAGE" }}
                fallback={
                  <p className="text-xs text-zinc-500">
                    Create a page first to use components.
                  </p>
                }
              >
                {({ disabled }) => (
                  <button
                    type="button"
                    disabled
                    className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-not-allowed ${
                      disabled
                        ? "bg-zinc-200 text-zinc-500"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    + New component
                  </button>
                )}
              </DependencyGate>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Shared (Site-wide)
              </h4>
              <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-500">
                <EmptyState
                  title="No shared components yet."
                  className="space-y-0"
                  titleClassName="text-xs text-zinc-500 font-normal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                This page
              </h4>
              <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-500">
                <EmptyState
                  title="No page components yet."
                  className="space-y-0"
                  titleClassName="text-xs text-zinc-500 font-normal"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
