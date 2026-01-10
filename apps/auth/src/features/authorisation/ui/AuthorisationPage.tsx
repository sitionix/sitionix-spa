import { useState } from "react";
import {
  AuthInput,
  AuthSidePanel,
  type AuthInputProps,
  type AuthSidePanelProps,
  type SocialAuthActions,
} from "@sitionix/ui";
import { useNavigate } from "react-router-dom";
import type { GlobalUserRole } from "@sitionix/contracts";
import EmailAuthorisationForm from "./EmailAuthorisationForm";

function readSiteIdFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("siteId");
}

const socialActions: SocialAuthActions = {
  onGoogle: () => console.log("google"),
  onFacebook: () => console.log("facebook"),
  onApple: () => console.log("apple"),
};

export default function AuthorisationPage() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const siteId = readSiteIdFromUrl();
  const role: GlobalUserRole = "SUPER_ADMIN";

  const authInput: AuthInputProps = {
    type: "email",
    label: "Електрона пошта",
    autoComplete: "email",
    onChange: (event) => setEmail(event.target.value),
    value: email,
  };

  const authProps: AuthSidePanelProps = {
    title: "Авторизація",
    subtitle: "Увійдіть. Керуйте. Процвітайте.",
    primaryCtaLabel: "Увійти через пошту",
    primaryCtaClick: () => setIsEmailOpen(true),
    socialAction: socialActions,
    legalSlot: <div>Політика конфіденційності</div>,
    accoutLabel: "У Вас ще не має аккаунту?",
    accountCtaLabel: "Зареєструватись",
    accountCtaClick: () => navigate("/"),
    topInputSlot: <AuthInput {...authInput} />,
  };
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-10">
        <div className="mb-10 text-4xl font-semibold">Sitionix</div>

        <div className="flex w-full items-start justify-center">
          <AuthSidePanel {...authProps} />
        </div>
      </div>

      <div
        className={[
          "fixed inset-0 z-50",
          isEmailOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setIsEmailOpen(false)}
          className={[
            "absolute inset-0 bg-black/25 transition-opacity",
            isEmailOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Закрити панель"
        />

        <div
          className={[
            "absolute right-0 top-0 h-full w-full max-w-md",
            "bg-gray-200 shadow-xl",
            "transform transition-transform duration-300 ease-out",
            isEmailOpen ? "translate-x-0" : "translate-x-full",
            "p-6",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="h-full">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Вхід поштою</div>

              <button
                type="button"
                onClick={() => setIsEmailOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>

            <EmailAuthorisationForm
              onSuccess={() => setIsEmailOpen(false)}
              role={role}
              {...(siteId ? { siteId } : {})}
              initialEmail={email}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
