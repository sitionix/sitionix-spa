import EmailRegisterForm from "./EmailRegisterForm";
import type { RegisterContext } from "../model/RegisterContext";
import type { RegisterHandlers } from "../model/RegisterHandlers";

export type EmailRegisterPanelProps = {
  isSuccess: boolean;
  ctx: RegisterContext;
  handlers: RegisterHandlers;
};

export default function EmailRegistrationPanel(props: EmailRegisterPanelProps) {
  const ctx: RegisterContext = props.ctx;
  return (
    <div className="rounded-2xl bg-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {props.isSuccess ? "Готово" : "Реєстрація поштою"}
        </div>

        <button
          type="button"
          onClick={props.handlers.onClose}
          className="rounded-md px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
          aria-label="Закрити"
        >
          ✕
        </button>
      </div>

      {props.isSuccess ? (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-700">
          Перевір пошту — ми надіслали лист для підтвердження.
        </div>
      ) : (
        <EmailRegisterForm
          onSuccess={props.handlers.onSuccess}
          {...(ctx.siteId ? { siteId: ctx.siteId } : {})}
          role={ctx.role}
        />
      )}
    </div>
  );
}
