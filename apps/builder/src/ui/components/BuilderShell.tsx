import { TopBar } from "./TopBar";
import { Canvas } from "./Canvas";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { CreatePageModal } from "./CreatePageModal";
import { DeletePageModal } from "./DeletePageModal";
import { FullscreenPreview } from "./FullscreenPreview";

export const BuilderShell = ({ siteId }: { siteId: string }) => {
  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <TopBar siteId={siteId} />
      <CreatePageModal />
      <DeletePageModal />
      <FullscreenPreview />
      <div className="flex-1 grid grid-cols-[280px_minmax(0,1fr)_320px] min-h-0">
        <div className="border-r border-zinc-200">
          <LeftPanel />
        </div>
        <Canvas />
        <div className="border-l border-zinc-200">
          <RightPanel />
        </div>
      </div>
    </div>
  );
};
