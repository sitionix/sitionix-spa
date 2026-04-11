import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { X } from "lucide-react";
import { createAgent, type AutomationAgent } from "../../api/agentsApi";

type CreateAgentSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (agent: AutomationAgent) => void;
};

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;
const FIELD_BASE_CLASS =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4";
const FIELD_ERROR_CLASS = "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100";
const FIELD_DEFAULT_CLASS = "border-zinc-200 bg-white focus:border-blue-400 focus:ring-blue-100";

type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  isInvalid: boolean;
  errorMessage: string;
  placeholder: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  multiline?: boolean;
};

type SheetLifecycleOptions = {
  open: boolean;
  closeSheet: () => void;
  focusRef: RefObject<HTMLInputElement | null>;
  toastMessage: string | null;
  clearToast: () => void;
};

function FormField({
  id,
  label,
  value,
  maxLength,
  isInvalid,
  errorMessage,
  placeholder,
  onChange,
  inputRef,
  multiline = false,
}: FormFieldProps) {
  const className = `${FIELD_BASE_CLASS} ${isInvalid ? FIELD_ERROR_CLASS : FIELD_DEFAULT_CLASS}`;

  return (
    <div className="mt-6 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-800">
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className={className}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          ref={inputRef}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
          placeholder={placeholder}
        />
      )}

      {isInvalid ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </div>
  );
}

function useCreateAgentSheetLifecycle({
  open,
  closeSheet,
  focusRef,
  toastMessage,
  clearToast,
}: SheetLifecycleOptions) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      focusRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [focusRef, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      closeSheet();
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [closeSheet, open]);

  useEffect(() => {
    if (toastMessage === null) {
      return;
    }

    const timerId = window.setTimeout(() => {
      clearToast();
    }, 4000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [clearToast, toastMessage]);
}

export function CreateAgentSheet({ open, onClose, onCreated }: CreateAgentSheetProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedDescription = useMemo(() => description.trim(), [description]);
  const isNameValid = trimmedName.length > 0;
  const isDescriptionValid = trimmedDescription.length > 0;

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setHasSubmitted(false);
    setToastMessage(null);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);
  useCreateAgentSheetLifecycle({
    open,
    closeSheet: handleClose,
    focusRef: nameInputRef,
    toastMessage,
    clearToast,
  });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      setHasSubmitted(true);
      if (!isNameValid || !isDescriptionValid) {
        return;
      }

      setToastMessage(null);
      setIsSubmitting(true);

      try {
        const createdAgent = await createAgent({
          name: trimmedName,
          description: trimmedDescription,
        });
        resetForm();
        onClose();
        onCreated(createdAgent);
      } catch {
        setToastMessage("Не вдалося створити агента. Спробуйте ще раз.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isDescriptionValid,
      isNameValid,
      isSubmitting,
      onClose,
      onCreated,
      resetForm,
      trimmedDescription,
      trimmedName,
    ]
  );

  if (!open) {
    return null;
  }

  return (
    <>
      {toastMessage ? (
        <div
          role="alert"
          className="fixed right-4 top-4 z-[70] max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg"
        >
          {toastMessage}
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Close create agent sheet"
        className="fixed inset-0 z-50 bg-black/35"
        onClick={handleClose}
      />

      <aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-[520px] border-l border-zinc-200 bg-white shadow-2xl">
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex h-full flex-col overflow-y-auto p-6 md:p-8"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Create Agent</h2>
            <button
              type="button"
              aria-label="Close"
              className="h-10 w-10 rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              onClick={handleClose}
            >
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>

          <FormField
            id="create-agent-name"
            label="Name"
            inputRef={nameInputRef}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            isInvalid={hasSubmitted && !isNameValid}
            errorMessage="Назва агента обов'язкова."
            placeholder="Architecture Reviewer"
            onChange={setName}
          />

          <FormField
            id="create-agent-description"
            label="Description"
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            isInvalid={hasSubmitted && !isDescriptionValid}
            errorMessage="Опис агента обов'язковий."
            placeholder="Minimal internal agent foundation entry"
            onChange={setDescription}
            multiline
          />

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
