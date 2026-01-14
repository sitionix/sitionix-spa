export type AuthButtonProps = {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function AuthButton({
  label,
  isLoading = false,
  disabled = false,
  type = "button",
  onClick,
}: Readonly<AuthButtonProps>) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "w-full rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 py-3",
        "text-sm font-medium text-white shadow transition",
        "hover:from-brand-600 hover:to-accent-600",
        "disabled:opacity-50",
      ].join(" ")}
    >
      {isLoading ? "Відправляємо..." : label}
    </button>
  );
}
