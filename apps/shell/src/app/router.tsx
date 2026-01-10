import { createBrowserRouter, Link } from "react-router-dom";
import { AuthRemote } from "../mf/AuthRemote";

function Home() {
  return (
    <div className="min-h-screen bg-brand-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
        <div className="text-2xl font-semibold text-gray-900">Shell</div>
        <div className="mt-2 text-sm text-gray-600">
          Це host-додаток. Звідси ми монтуємо microfrontends.
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            className="rounded-xl bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
            to="/auth"
          >
            Відкрити Auth MF
          </Link>
        </div>
      </div>
    </div>
  );
}

export function createShellRouter() {
  return createBrowserRouter(
    [
      { path: "/", element: <Home /> },

      // Тут MF буде змонтований всередині Shell
      { path: "/auth/*", element: <AuthRemote basename="/auth" /> }
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );
}
