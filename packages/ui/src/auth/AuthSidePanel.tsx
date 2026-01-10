import { ReactNode } from "react";
import {
  SocialAuthActions,
  SocialAuthPanel,
} from "./social-auth/SocialAuthPanel";

export type AuthSidePanelProps = {
  title: string;
  subtitle: string;
  topInputSlot?: ReactNode;
  primaryCtaLabel: string;
  primaryCtaClick: () => void;
  socialAction: SocialAuthActions;
  legalSlot?: ReactNode;
};

export function AuthSidePanel(props: AuthSidePanelProps) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="text-2xl font-semibold">{props.title}</div>
      <div className="mt-2 text-lg text-gray-600">{props.subtitle}</div>
      <button
        type="button"
        onClick={props.primaryCtaClick}
        className="mt-6 w-full rounded-lg bg-black py-3 text-sm font-medium text-white shadow"
      >
        {props.primaryCtaLabel}
      </button>
      <div className="mt-6 w-full">
      <SocialAuthPanel actions={props.socialAction} />
      </div>
    </div>
  );
}
