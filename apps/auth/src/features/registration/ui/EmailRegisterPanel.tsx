import type { GlobalUserRole } from "@sitionix/contracts";
import EmailRegisterForm from "./EmailRegisterForm";

type Props = {
  isSuccess: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siteId?: string;
  role: GlobalUserRole;
};

export default function EmailRegistrationPanel({
  isSuccess,
  onClose,
  onSuccess,
  siteId,
  role,
}: Props) {
  return (
    <div className="rounded-2xl bg-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {isSuccess ? "Готово" : "Реєстрація поштою"}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
          aria-label="Закрити"
        >
          ✕
        </button>
      </div>

      {isSuccess ? (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-700">
          Перевір пошту — ми надіслали лист для підтвердження.
        </div>
      ) : (
        <EmailRegisterForm onSuccess={onSuccess} {...(siteId ? { siteId } : {})} role={role} />
      )}
    </div>
  );
}
