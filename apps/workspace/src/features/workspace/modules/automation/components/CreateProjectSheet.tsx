import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH } from "../model/constants";
import type { AgentProject } from "../model/types";

type CreateProjectSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; description?: string }) => Promise<AgentProject>;
  onCreated: (project: AgentProject) => void;
};

const FIELD_BASE_CLASS =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4";
const FIELD_ERROR_CLASS = "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100";
const FIELD_DEFAULT_CLASS = "border-zinc-200 bg-white focus:border-blue-400 focus:ring-blue-100";

export function CreateProjectSheet({ open, onClose, onCreate, onCreated }: Readonly<CreateProjectSheetProps>) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedDescription = useMemo(() => description.trim(), [description]);
  const isNameValid = trimmedName.length > 0;

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setHasSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setHasSubmitted(true);
    if (!isNameValid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const createdProject = await onCreate({
        name: trimmedName,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      onCreated(createdProject);
      resetForm();
      onClose();
    } catch {
      setSubmitError("Failed to create project. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isNameValid, isSubmitting, onClose, onCreated, resetForm, trimmedDescription, trimmedName]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close create project sheet"
        className="fixed inset-0 z-50 bg-black/35"
        onClick={handleClose}
      />

      <aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-[520px] border-l border-zinc-200 bg-white shadow-2xl">
        <form noValidate onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Create Project</h2>
            <button
              type="button"
              aria-label="Close"
              className="h-10 w-10 rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              onClick={handleClose}
            >
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="project-name" className="block text-sm font-medium text-zinc-800">Name</label>
            <input
              id="project-name"
              ref={nameInputRef}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${FIELD_BASE_CLASS} ${hasSubmitted && !isNameValid ? FIELD_ERROR_CLASS : FIELD_DEFAULT_CLASS}`}
              placeholder="Marketing Automation"
            />
            {hasSubmitted && !isNameValid ? <p className="text-sm text-red-600">Project name is required.</p> : null}
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="project-description" className="block text-sm font-medium text-zinc-800">Description</label>
            <textarea
              id="project-description"
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className={`${FIELD_BASE_CLASS} ${FIELD_DEFAULT_CLASS}`}
              placeholder="Project for marketing agents and campaign automation"
            />
          </div>

          {submitError ? <p className="mt-6 text-sm text-red-600">{submitError}</p> : null}

          <div className="mt-auto flex justify-end gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
