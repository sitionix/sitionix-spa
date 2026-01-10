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
      className="w-full min-h-12 bg-gray-400"
    >
      <span className="flex h-10 w-10 items-center justify-center justify-self-start">
        {placeholderIcon}
      </span>

    </button>
  );
}
