export type SocialAuthActions = {
    onGoogle: () => void;
    onFacebook: () => void;
    onApple: () => void;
};
export type SocialAuthPanelProps = {
    actions: SocialAuthActions;
    dividerLabel?: string;
};
export declare function SocialAuthPanel({ actions, dividerLabel, }: SocialAuthPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SocialAuthPanel.d.ts.map