import { useEffect, useState } from "react";
import type { GlobalUserRole } from "@sitionix/contracts";
import { AuthButton, AuthInput } from "@sitionix/ui";
import { getOrCreateSessionSourceId, saveAuthTokens } from "@sitionix/auth-session";
import { loginUserApi } from "../api/loginUserApi";
import { mapFormToLoginRequest } from "../model/loginUserMapper";
import type { LoginContext } from "../model/LoginContext";
import type { LoginFormValues } from "../model/loginUserTypes";
import { getUserAgent } from "../../../shared/session/userAgent";

type Props = {
  onSuccess: () => void;
  siteId?: string;
  role: GlobalUserRole;
  initialEmail?: string;
};

export default function EmailAuthorisationForm({
  onSuccess,
  siteId,
  role,
  initialEmail,
}: Readonly<Props>) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof initialEmail === "string") {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorText(null);
        setIsSubmitting(true);

        try {
          const values: LoginFormValues = { email, password, rememberMe };
          const ctx: LoginContext = {
            role,
            siteId,
            sessionSourceId: getOrCreateSessionSourceId(),
            userAgent: getUserAgent(),
          };
          const req = mapFormToLoginRequest(values, ctx);
          const result = await loginUserApi(req);

          if (result.ok) {
            saveAuthTokens(result.data, rememberMe);
            onSuccess();
            return;
          }

          setErrorText(result.error.details ?? "Помилка авторизації");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <AuthInput
        label="Електрона пошта"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
      />

      <AuthInput
        label="Пароль"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
      />

      {errorText ? (
        <div className="rounded-lg bg-white p-3 text-sm text-red-600">
          {errorText}
        </div>
      ) : null}

      <div className="mt-2">
        <AuthButton
          type="submit"
          label="Увійти"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </div>

      <label className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <input
          type="checkbox"
          className="h-3 w-3"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        <span>Запам’ятати мене</span>
      </label>
    </form>
  );
}
