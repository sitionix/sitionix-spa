import { SocialAuthButton } from "./SocialAuthButton";

export type SocialAuthActions = {
  onGoogle: () => void;
  onFacebook: () => void;
  onApple: () => void;
};

export type SocialAuthPanelProps = {
  actions: SocialAuthActions;
  dividerLabel?: string;
};

export function SocialAuthPanel({
  actions,
  dividerLabel = "або",
}: SocialAuthPanelProps) {
  return (
    <div>
      <div className="mt-8 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 text-gray-500">
        <div className="h-px bg-gray-200" />
        <div className="justify-self-center text-base">{dividerLabel}</div>
        <div className="h-px bg-gray-200" />
      </div>

      <div className="mt-6 space-y-4">
        <SocialAuthButton
          label="Google"
          placeholderIcon="G"
          onClick={actions.onGoogle}
        />
        <SocialAuthButton
          label="Facebook"
          placeholderIcon="f"
          onClick={actions.onFacebook}
        />
        <SocialAuthButton
          label="Apple"
          placeholderIcon=""
          onClick={actions.onApple}
        />
      </div>
    </div>
  );
}
