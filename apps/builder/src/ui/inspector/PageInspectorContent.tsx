import type { RefObject } from "react";

type PageInspectorContentProps = {
  nameInputRef: RefObject<HTMLInputElement>;
  name: string;
  slug: string;
  isHome: boolean;
  showNameError: boolean;
  nameError: string | null;
  showSlugError: boolean;
  slugError: string | null;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onSlugChange: (value: string) => void;
  onSlugBlur: () => void;
  onSetHome: () => void;
};

export const PageInspectorContent = ({
  nameInputRef,
  name,
  slug,
  isHome,
  showNameError,
  nameError,
  showSlugError,
  slugError,
  onNameChange,
  onNameBlur,
  onSlugChange,
  onSlugBlur,
  onSetHome,
}: PageInspectorContentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Page</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Manage the active page metadata.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Name
        </span>
        <input
          ref={nameInputRef}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={onNameBlur}
          className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showNameError ? (
          <p className="mt-2 text-xs text-rose-600">{nameError}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Slug / Path
        </span>
        <input
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          onBlur={onSlugBlur}
          disabled={isHome}
          className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isHome
              ? "bg-zinc-100 text-zinc-400 border-zinc-200"
              : "border-zinc-200"
          }`}
          placeholder="/about"
        />
        {showSlugError ? (
          <p className="mt-2 text-xs text-rose-600">{slugError}</p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Format: /about</p>
        )}
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2">
        <input
          type="checkbox"
          className="mt-1"
          checked={isHome}
          disabled={isHome}
          onChange={(event) => {
            if (event.target.checked) {
              onSetHome();
            }
          }}
        />
        <span>
          <span className="block text-sm font-medium text-zinc-900">
            Home page
          </span>
          <span className="block text-xs text-zinc-500">
            {isHome ? "This page is the home page." : "Set this page as the home page."}
          </span>
        </span>
      </label>
    </div>
  );
};
