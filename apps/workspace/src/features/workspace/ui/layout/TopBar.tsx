import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  User,
} from "lucide-react";

const sectionLabels: Array<{ match: (path: string) => boolean; label: string }> = [
  { match: (path) => path === "/", label: "Dashboard" },
  { match: (path) => path.startsWith("/sites"), label: "Вебсайти" },
  { match: (path) => path.startsWith("/collections"), label: "Колекції" },
  { match: (path) => path.startsWith("/domains"), label: "Домени" },
  { match: (path) => path.startsWith("/trash"), label: "Кошик" },
  { match: (path) => path.startsWith("/crm"), label: "Аналітика CRM" },
];

export function TopBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const currentSection = useMemo(() => {
    const match = sectionLabels.find((item) => item.match(location.pathname));
    return match?.label ?? "Workspace";
  }, [location.pathname]);

  const initials = "WS";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <Link
          to="/sites"
          className="flex items-center transition-transform duration-150 active:scale-[0.98]"
        >
          <div className="text-2xl font-bold text-blue-600">Sitionix</div>
        </Link>

        <div className="flex-1 px-12">
          <div className="text-sm text-zinc-600">{currentSection}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors duration-200 active:scale-[0.98]"
            aria-label="Допомога"
          >
            <HelpCircle className="w-5 h-5 text-zinc-600" />
          </button>

          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors duration-200 active:scale-[0.98]"
            aria-label="Сповіщення"
          >
            <Bell className="w-5 h-5 text-zinc-600" />
          </button>

          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors duration-200 active:scale-[0.98]"
            aria-label="Налаштування"
          >
            <Settings className="w-5 h-5 text-zinc-600" />
          </button>

          <div className="relative ml-2">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors duration-200 flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-500" />
                    Профіль
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors duration-200 flex items-center gap-3">
                    <Settings className="w-4 h-4 text-zinc-500" />
                    Налаштування акаунта
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
