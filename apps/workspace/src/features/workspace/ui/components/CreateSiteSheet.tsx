import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import { createSite, type CreateSiteRequest } from "../../api/sitesApi";

type CreateSiteSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (siteId: string, siteName: string) => void;
};

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

const typeOptions: ReadonlyArray<{ label: string; value: NonNullable<CreateSiteRequest["type"]> }> = [
  { label: "Portfolio", value: "portfolio" },
  { label: "Business", value: "business" },
  { label: "Blog", value: "blog" },
  { label: "Store", value: "store" },
  { label: "Landing", value: "landing" },
  { label: "Other", value: "other" },
];

const templateOptions: ReadonlyArray<{
  label: string;
  value: NonNullable<CreateSiteRequest["template"]>;
}> = [
  { label: "Blank", value: "blank" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Business", value: "business" },
];

export function CreateSiteSheet({ open, onClose, onCreated }: CreateSiteSheetProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [siteType, setSiteType] = useState<NonNullable<CreateSiteRequest["type"]> | "">("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<NonNullable<CreateSiteRequest["template"]> | "">("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [hasNameInteracted, setHasNameInteracted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameValid = trimmedName.length > 0;
  const showNameError = !isNameValid && (hasNameInteracted || hasSubmitted);

  const resetForm = useCallback(() => {
    setName("");
    setSiteType("");
    setDescription("");
    setTemplate("");
    setIsAdvancedOpen(false);
    setHasNameInteracted(false);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleClose, open]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      setHasSubmitted(true);
      if (!isNameValid) {
        return;
      }

      setToastMessage(null);
      setIsSubmitting(true);

      const payload: CreateSiteRequest = {
        name: trimmedName,
      };

      const descriptionValue = description.trim();
      if (siteType) {
        payload.type = siteType;
      }
      if (descriptionValue) {
        payload.description = descriptionValue;
      }
      if (template) {
        payload.template = template;
      }

      try {
        const result = await createSite(payload);
        resetForm();
        onClose();
        onCreated(result.id, trimmedName);
      } catch {
        const errorMessage = "Не вдалося створити сайт. Спробуйте ще раз.";
        setToastMessage(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      description,
      isNameValid,
      isSubmitting,
      onClose,
      onCreated,
      resetForm,
      siteType,
      template,
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
        aria-label="Close create site sheet"
        className="fixed inset-0 z-50 bg-black/35"
        onClick={handleClose}
      />

      <aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-[520px] border-l border-zinc-200 bg-white shadow-2xl">
        <form
          noValidate
          onSubmit={handleSubmit}
          className="h-full overflow-y-auto p-6 md:p-8 flex flex-col"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Створити сайт</h2>
            <button
              type="button"
              aria-label="Close"
              className="h-10 w-10 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              onClick={handleClose}
            >
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="create-site-name" className="block text-sm font-medium text-zinc-800">
              Site name
            </label>
            <input
              id="create-site-name"
              ref={nameInputRef}
              maxLength={NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setHasNameInteracted(true);
                setToastMessage(null);
              }}
              onBlur={() => setHasNameInteracted(true)}
              placeholder="Напр. Портфоліо агенції"
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:border-transparent ${
                showNameError
                  ? "border-red-300 focus:ring-red-400"
                  : "border-zinc-200 focus:ring-blue-500"
              }`}
            />
            {showNameError ? (
              <p className="text-xs text-red-600">Введіть назву сайту</p>
            ) : null}
          </div>

          <div className="mt-5">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
              onClick={() => setIsAdvancedOpen((prev) => !prev)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isAdvancedOpen ? "rotate-180" : "rotate-0"
                }`}
              />
              Розширені налаштування
            </button>
          </div>

          {isAdvancedOpen ? (
            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="space-y-2">
                <label htmlFor="create-site-type" className="block text-sm font-medium text-zinc-800">
                  Type
                </label>
                <select
                  id="create-site-type"
                  value={siteType}
                  onChange={(event) => {
                    setSiteType(event.target.value as NonNullable<CreateSiteRequest["type"]> | "");
                    setToastMessage(null);
                  }}
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not selected</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-site-description"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Description
                </label>
                <textarea
                  id="create-site-description"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setToastMessage(null);
                  }}
                  rows={4}
                  placeholder="Короткий опис майбутнього сайту"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-zinc-500 text-right">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="create-site-template" className="block text-sm font-medium text-zinc-800">
                  Template
                </label>
                <select
                  id="create-site-template"
                  value={template}
                  onChange={(event) => {
                    setTemplate(event.target.value as NonNullable<CreateSiteRequest["template"]> | "");
                    setToastMessage(null);
                  }}
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not selected</option>
                  {templateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="flex-1" />

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={!isNameValid || isSubmitting}
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
