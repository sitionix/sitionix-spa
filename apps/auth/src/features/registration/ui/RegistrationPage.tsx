import { useMemo, useState } from "react";
import EmailRegistrationPanel from "./EmailRegisterPanel";
import type { GlobalUserRole } from "@sitionix/contracts";

function readSiteIdFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("siteId");
}

export default function RegistrationPage() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const siteId = useMemo(() => readSiteIdFromUrl(), []);
  const role: GlobalUserRole = "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-10">
        <div className="mb-10 text-4xl font-semibold">Sitionix</div>

        <div className="relative w-full">
          {/* LEFT COLUMN */}
          <div
            className={[
              "mx-auto w-full max-w-md transition-transform duration-500 ease-out",
              // Only slide on desktop (lg+). On mobile we keep it centered.
              isEmailOpen ? "lg:-translate-x-60" : "translate-x-0",
            ].join(" ")}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-semibold">Реєстрація</div>
              <div className="mt-2 text-lg text-gray-600">
                Створюйте. Керуйте. Процвітайте.
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEmailOpen(true);
                }}
                className="mt-6 w-full rounded-lg bg-black py-3 text-sm font-medium text-white shadow disabled:opacity-50"
              >
                реєстрація через пошту
              </button>

              <div className="my-6 flex w-full items-center gap-4 text-sm text-gray-500">
                <div className="h-px flex-1 bg-gray-200" />
                <div>або</div>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex w-full flex-col gap-3">
                <button className="flex items-center justify-center gap-3 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-900">
                  <span className="inline-block h-5 w-5 rounded-full bg-gray-300" />
                  Google
                </button>
                <button className="flex items-center justify-center gap-3 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-900">
                  <span className="inline-block h-5 w-5 rounded-full bg-gray-300" />
                  Facebook
                </button>
                <button className="flex items-center justify-center gap-3 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-900">
                  <span className="inline-block h-5 w-5 rounded-full bg-gray-300" />
                  Apple
                </button>
              </div>

              <div className="mt-8 text-sm text-gray-500">
                Натискаючи продовжити ви погоджуєтесь з нашими{" "}
                <span className="font-medium text-gray-900">
                  Умовами надання послуг
                </span>{" "}
                та{" "}
                <span className="font-medium text-gray-900">
                  Політикою конфіденційності
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP RIGHT SLIDE-IN (lg+) */}
          <div
            className={[
              "hidden lg:block",
              "pointer-events-none absolute left-1/2 top-0 w-full max-w-md -translate-x-1/2",
              "transition-all duration-500 ease-out",
              isEmailOpen ? "translate-x-10 opacity-100" : "translate-x-96 opacity-0",
            ].join(" ")}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="pointer-events-auto mt-6 lg:mt-0">
              {isEmailOpen ? (
                <EmailRegistrationPanel
                  isSuccess={isSuccess}
                  onClose={() => setIsEmailOpen(false)}
                  onSuccess={() => setIsSuccess(true)}
                  {...(siteId ? { siteId } : {})}
                  role={role}
                />
              ) : null}
            </div>
          </div>

          {/* MOBILE OVERLAY ( < lg ) */}
          {isEmailOpen && siteId ? (
            <div className="lg:hidden">
              <div
                className="fixed inset-0 z-40 bg-black/30"
                onClick={() => setIsEmailOpen(false)}
              />
              <div className="fixed inset-x-0 bottom-0 z-50 p-4">
                <EmailRegistrationPanel
                  isSuccess={isSuccess}
                  onClose={() => setIsEmailOpen(false)}
                  onSuccess={() => setIsSuccess(true)}
                  {...(siteId ? { siteId } : {})}
                  role={role}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
