import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SocialAuthButton({ label, placeholderIcon, onClick, }) {
    return (_jsxs("button", { type: "button", onClick: onClick, className: "flex w-full items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-base font-medium text-gray-900 shadow-sm hover:bg-gray-200", children: [_jsx("span", { className: "flex h-7 w-7 items-center justify-center rounded-md bg-gray-300 text-xs font-bold text-gray-700", children: placeholderIcon }), _jsx("span", { className: "flex-1 text-center", children: label }), _jsx("span", { className: "w-7" })] }));
}
