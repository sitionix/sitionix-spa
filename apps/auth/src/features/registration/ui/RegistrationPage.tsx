import { useState } from "react";
import RegisterIntro from "./RegistrationIntro";
import EmailRegistrationPanel, {
  type EmailRegisterPanelProps,
} from "./EmailRegisterPanel";

function readSiteIdFromUrl(): string | undefined {
  const url = new URL(window.location.href);
  return url.searchParams.get("siteId") ?? undefined;
}

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-10">
        <div className="mb-10 text-4xl font-semibold">Sitionix</div>

      <div className="flex w-full items-start justify-center gap-10">

        <RegisterIntro onEmailOpen={() => setIsEmailOpen(true)} />

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
