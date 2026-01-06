export type SocialAuthButtonProps = {
  label: string;
  placeholderIcon: string; // "G", "f", ""
  onClick: () => void;
};

export function SocialAuthButton({
  label,
  placeholderIcon,
  onClick,
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-base font-medium text-gray-900 shadow-sm hover:bg-gray-200"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-300 text-xs font-bold text-gray-700">
        {placeholderIcon}
      </span>

      <span className="flex-1 text-center">{label}</span>

      <span className="w-7" />
    </button>
  );
}
