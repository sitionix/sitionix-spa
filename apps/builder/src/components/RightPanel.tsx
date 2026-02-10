import { PanelShell } from "./PanelShell";

export const RightPanel = () => {
  return (
    <PanelShell title="Inspector">
      <div className="text-sm text-zinc-500">
        Select an element to inspect its properties.
      </div>
    </PanelShell>
  );
};
