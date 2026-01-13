import { ReactNode } from "react";
import {
  SocialAuthActions,
  SocialAuthPanel,
} from "./social-auth/SocialAuthPanel";
import { AuthButton } from "./AuthButton";

export type AuthSidePanelProps = {
  title: string;
  subtitle: string;
  topInputSlot?: ReactNode;
  primaryCtaLabel: string;
  primaryCtaClick: () => void;
  socialAction: SocialAuthActions;
  legalSlot?: ReactNode;
  accoutLabel: string;
  accountCtaLabel: string;
  accountCtaClick: () => void;
};

export function AuthSidePanel(props: Readonly<AuthSidePanelProps>) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="text-2xl font-semibold">{props.title}</div>
      <div className="mt-2 text-lg text-gray-600">{props.subtitle}</div>
      <div className=" mt-2 w-full">{props.topInputSlot}</div>
      <div className="mt-6">
        <AuthButton
          type="button"
          label={props.primaryCtaLabel}
          onClick={props.primaryCtaClick}
        />
      </div>
      <div className="mt-6 w-full">
        <SocialAuthPanel actions={props.socialAction} />
      </div>
      <div className="font-semibold mt-4">{props.legalSlot}</div>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <span className="font-light text-gray-600">{props.accoutLabel}</span>

        <button
          type="button"
          onClick={props.accountCtaClick}
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          {props.accountCtaLabel}
        </button>
      </div>
    </div>
  );
}
