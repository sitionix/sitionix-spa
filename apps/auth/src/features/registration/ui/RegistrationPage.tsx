import { useState } from "react";
import EmailRegistrationPanel, {
  type EmailRegisterPanelProps,
} from "./EmailRegisterPanel";
import { AuthSidePanel, type AuthSidePanelProps, type SocialAuthActions } from "@sitionix/ui";

function readSiteIdFromUrl(): string | undefined {
  const url = new URL(window.location.href);
  return url.searchParams.get("siteId") ?? undefined;
}

const socialActions: SocialAuthActions = {
  onGoogle: () => console.log("google"),
  onFacebook: () => console.log("facebook"),
  onApple: () => console.log("apple"),
};

export default function RegisterPage() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const props: EmailRegisterPanelProps = {
    isSuccess,
    ctx: { role: "SUPER_ADMIN", siteId: readSiteIdFromUrl() },
    handlers: {
      onClose: () => setIsEmailOpen(false),
      onSuccess: () => setIsSuccess(true),
    },
  };

  const authProps: AuthSidePanelProps = {
    title: "Реєстраці",
    subtitle: "Увійдіть. Керуйте. Процвітайте.",
    topInputSlot: <input
        placeholder="Електрона пошта"
        className="w-full rounded-lg bg-white px-4 py-3 text-sm outline-none"
        autoComplete="email"
      />,
    primaryCtaLabel: "Реєстрація через пошту",
    primaryCtaClick: () => setIsEmailOpen(true),
    socialAction: socialActions,
    legalSlot: <div></div>
    
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-10">
        <div className="mb-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Tailwind is working
        </div>
        <div className="mb-10 text-4xl font-semibold">Sitionix</div>

      <div className="flex w-full items-start justify-center gap-10">

        <AuthSidePanel {...authProps}/>

        {isEmailOpen ? (
          <div className="mt-6 w-full max-w-md">
            <EmailRegistrationPanel {...props} />
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
