import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailRegistrationPanel, {
  type EmailRegisterPanelProps,
} from "./EmailRegisterPanel";
import {
  AuthSidePanel,
  type AuthSidePanelProps,
  type SocialAuthActions,
} from "@sitionix/ui";

function readSiteIdFromUrl(): string | null {
  const url = new URL(globalThis.window.location.href);
  return url.searchParams.get("siteId");
}

const socialActions: SocialAuthActions = {
  onGoogle: () => console.log("google"),
  onFacebook: () => console.log("facebook"),
  onApple: () => console.log("apple"),
};

export default function RegistrationPage() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const siteId = readSiteIdFromUrl();
  const props: EmailRegisterPanelProps = {
    isSuccess,
    ctx: { role: "SUPER_ADMIN", ...(siteId ? { siteId } : {}) },
    handlers: {
      onClose: () => setIsEmailOpen(false),
      onSuccess: () => setIsSuccess(true),
    },
  };

  const authProps: AuthSidePanelProps = {
    title: "Реєстраці",
    subtitle: "Створюйте. Керуйте. Процвітайте.",
    primaryCtaLabel: "Зареєструватись через пошту",
    primaryCtaClick: () => setIsEmailOpen(true),
    socialAction: socialActions,
    legalSlot: <div>Політика конфіденційності</div>,
    accoutLabel: "Вже маєте аккаунт?",
    accountCtaLabel: "Увійти",
    accountCtaClick: () => navigate("/authorisation"),
  };
  return (
    <div className="min-h-screen bg-brand-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-10">
        <div className="mb-10 text-4xl font-semibold">Sitionix</div>

        <div className="flex w-full items-start justify-center">
          <AuthSidePanel {...authProps} />
        </div>
      </div>

      {/* Оверлей + Drawer (без зсуву основи) */}
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

        <dialog
          className={[
            "absolute right-0 top-0 left-auto bottom-auto h-full w-full max-w-md m-0",
            "bg-gray-200 shadow-xl",
            "transform transition-transform duration-300 ease-out",
            isEmailOpen ? "translate-x-0" : "translate-x-full",
            "p-6",
          ].join(" ")}
          open={isEmailOpen}
          aria-modal={isEmailOpen}
          aria-hidden={!isEmailOpen}
        >
          <EmailRegistrationPanel
            {...props}
            handlers={{
              ...props.handlers,
              onClose: () => setIsEmailOpen(false),
            }}
          />
        </dialog>
      </div>
    </div>
  );
}
