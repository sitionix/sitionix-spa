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
      className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white shadow disabled:opacity-50"
    >
      {isLoading ? "Відправляємо..." : label}
    </button>
  );
}
