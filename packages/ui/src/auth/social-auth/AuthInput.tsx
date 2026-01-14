import type { ChangeEventHandler } from "react";

export type AuthInputProps = {
  label: string;
  type: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: string;
  value: string;
};

export function AuthInput(props: Readonly<AuthInputProps>) {
  return (
    <input
      placeholder={props.label}
      type={props.type}
      value={props.value}
      className={[
        "w-full rounded-2xl border border-gray-300 bg-white px-6 py-4 text-gray-900",
        "placeholder:text-gray-400 outline-none",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
      ].join(" ")}
      onChange={props.onChange}
      autoComplete={props.autoComplete}
    />
  );
}
