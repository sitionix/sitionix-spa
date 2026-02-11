import type { SectionHeight } from "../../domain/document";

type SectionInspectorContentProps = {
  mode: SectionHeight["mode"];
  heightPx: string;
  minPx: string;
  maxPx: string;
  heightError: string | null;
  minError: string | null;
  maxError: string | null;
  showHeightError: boolean;
  showMinError: boolean;
  showMaxError: boolean;
  onModeChange: (mode: SectionHeight["mode"]) => void;
  onHeightChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onHeightBlur: () => void;
  onMinBlur: () => void;
  onMaxBlur: () => void;
};

export const SectionInspectorContent = ({
  mode,
  heightPx,
  minPx,
  maxPx,
  heightError,
  minError,
  maxError,
  showHeightError,
  showMinError,
  showMaxError,
  onModeChange,
  onHeightChange,
  onMinChange,
  onMaxChange,
  onHeightBlur,
  onMinBlur,
  onMaxBlur,
}: SectionInspectorContentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Section</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Adjust the section height settings.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Height mode
        </span>
        <select
          value={mode}
          onChange={(event) => onModeChange(event.target.value as SectionHeight["mode"])}
          className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
      </label>

      {mode === "manual" ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Height (px)
          </span>
          <input
            type="number"
            value={heightPx}
            onChange={(event) => onHeightChange(event.target.value)}
            onBlur={onHeightBlur}
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="480"
          />
          {showHeightError ? (
            <p className="mt-2 text-xs text-rose-600">{heightError}</p>
          ) : null}
        </label>
      ) : null}

      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Constraints
        </div>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Min height (px)
            </span>
            <input
              type="number"
              value={minPx}
              onChange={(event) => onMinChange(event.target.value)}
              onBlur={onMinBlur}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="120"
            />
            {showMinError ? (
              <p className="mt-2 text-xs text-rose-600">{minError}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Max height (px)
            </span>
            <input
              type="number"
              value={maxPx}
              onChange={(event) => onMaxChange(event.target.value)}
              onBlur={onMaxBlur}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="960"
            />
            {showMaxError ? (
              <p className="mt-2 text-xs text-rose-600">{maxError}</p>
            ) : null}
          </label>
        </div>
      </div>
    </div>
  );
};
