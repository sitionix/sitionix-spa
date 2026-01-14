export type SocialAuthButtonProps = {
  label: string;
  placeholderIcon: string; // "G", "f", ""
  onClick: () => void;
};

export function SocialAuthButton({
  label,
  placeholderIcon,
  onClick,
}: Readonly<SocialAuthButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex w-full min-h-12 items-center justify-center rounded-xl",
        "border border-gray-200 bg-white px-4 text-gray-900 shadow-sm",
        "hover:border-brand-200",
      ].join(" ")}
    >
      <span className="absolute left-4 flex h-10 w-10 items-center justify-center">
        {placeholderIcon}
      </span>

      <span className="text-base font-medium text-gray-900">{label}</span>
    </button>
  );
}
