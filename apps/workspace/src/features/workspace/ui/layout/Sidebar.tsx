import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  FolderOpen,
  Link2,
  Trash2,
  Bot,
  BarChart3,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard },
  { id: "sites", label: "Вебсайти", path: "/sites", icon: Globe },
  { id: "collections", label: "Колекції", path: "/collections", icon: FolderOpen },
  { id: "domains", label: "Домени", path: "/domains", icon: Link2 },
  { id: "trash", label: "Кошик", path: "/trash", icon: Trash2 },
  { id: "automation", label: "Automation", path: "/automation", icon: Bot },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[344px] bg-white border-r border-zinc-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 h-12 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-6 border-t border-zinc-200">
          <Link
            to="/crm"
            className={`flex items-center gap-3 h-12 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] ${
              location.pathname.startsWith("/crm")
                ? "bg-purple-50 text-purple-600 font-medium"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <BarChart3
              className="w-6 h-6"
              strokeWidth={location.pathname.startsWith("/crm") ? 2.5 : 2}
            />
            <span className="text-sm">Аналітика CRM</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
