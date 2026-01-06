import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SocialAuthButton } from "./SocialAuthButton";
export function SocialAuthPanel({ actions, dividerLabel = "або", }) {
    return (_jsxs("div", { children: [_jsxs("div", { className: "mt-8 flex items-center gap-4 text-gray-500", children: [_jsx("div", { className: "h-px flex-1 bg-gray-200" }), _jsx("div", { className: "text-base", children: dividerLabel }), _jsx("div", { className: "h-px flex-1 bg-gray-200" })] }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx(SocialAuthButton, { label: "Google", placeholderIcon: "G", onClick: actions.onGoogle }), _jsx(SocialAuthButton, { label: "Facebook", placeholderIcon: "f", onClick: actions.onFacebook }), _jsx(SocialAuthButton, { label: "Apple", placeholderIcon: "\uF8FF", onClick: actions.onApple })] })] }));
}
