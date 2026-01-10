import { useState } from "react";
import { registerUserApi } from "../api/registerUserApi";
import { mapFormToRegisterRequest } from "../model/registerUserMapper";
import type { GlobalUserRole } from "@sitionix/contracts";
import { AuthButton, AuthInput } from "@sitionix/ui";

type Props = {
  onSuccess: () => void;
  siteId?: string;
  role: GlobalUserRole;
};

export default function EmailRegisterForm({ onSuccess, siteId, role }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setErrorText(null);
        setIsSubmitting(true);

        try {
          const values = { email, name, password, passwordConfirm, rememberMe };
          const req = mapFormToRegisterRequest(values, { role });
          const result = await registerUserApi(req);

          if (result.ok) {
            onSuccess();
            return;
          }

          setErrorText(result.error.details ?? "Помилка реєстрації");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <AuthInput
        label="Електрона пошта"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <AuthInput
        label="Ім’я"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />

      <AuthInput
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />

      <AuthInput
        label="Повторіть пароль"
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        autoComplete="new-password"
      />

      {errorText ? (
        <div className="rounded-lg bg-white p-3 text-sm text-red-600">
          {errorText}
        </div>
      ) : null}

      <div className="mt-2">
        <AuthButton
          type="submit"
          label="Зареєструватись"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </div>

      <label className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <input
          type="checkbox"
          className="h-3 w-3"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Запам’ятати мене
      </label>

      <div className="pt-2 text-center text-xs text-gray-500">
        Натискаючи зареєструватись ви погоджуєтесь з нашими{" "}
        <span className="font-medium text-gray-900">
          Умовами надання послуг
        </span>{" "}
        та{" "}
        <span className="font-medium text-gray-900">
          Політикою конфіденційності
        </span>
      </div>
    </form>
  );
}
