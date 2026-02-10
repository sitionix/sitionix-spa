type PageInspectorDangerZoneProps = {
  onDelete: () => void;
};

export const PageInspectorDangerZone = ({
  onDelete,
}: PageInspectorDangerZoneProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Danger zone
      </h4>
      <button
        type="button"
        onClick={onDelete}
        className="h-9 px-4 rounded-lg border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50"
      >
        Delete page…
      </button>
    </div>
  );
};
