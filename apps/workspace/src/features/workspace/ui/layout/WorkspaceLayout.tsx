import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function WorkspaceLayout() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-zinc-50">
      <TopBar />
      <div className="flex h-[calc(100vh-64px)] mt-[64px]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto ml-[344px] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
