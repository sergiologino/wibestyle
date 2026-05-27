"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import MathCaptchaField from "@/components/auth/MathCaptchaField";
import { FieldInput, FieldLabel, FieldSelect, mutedTextClassName } from "@/components/ui/fields";

type Mode = "login" | "register";

export default function PasswordAuthForm({ mode: initialMode }: { mode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api, setAuth } = useAppSession();
  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishAuth(accessToken: string, refreshToken: string, newUser: boolean, expiresIn?: number) {
    const meClient = new WibeStyleApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
      getAccessToken: () => accessToken,
    });
    if (mode === "register" && (displayName.trim() || gender)) {
      await meClient.updateProfile({
        displayName: displayName.trim() || undefined,
        gender: gender || undefined,
      });
    }
    const me = await meClient.me();
    const phone = me.user.phone ?? me.user.login ?? me.user.email ?? "";
    setAuth(accessToken, phone, me.profile, refreshToken, expiresIn);
    router.push(
      resolvePostAuthRoute({
        newUser,
        hasActiveAvatar: Boolean(me.profile.activeAvatarId),
        nextParam: searchParams.get("next"),
      }),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const auth = await api.register({
          login,
          email: email.trim() || undefined,
          password,
          captchaId,
          captchaAnswer,
          displayName: displayName.trim() || undefined,
        });
        await finishAuth(auth.accessToken, auth.refreshToken, Boolean(auth.newUser), auth.expiresIn);
      } else {
        const auth = await api.loginWithPassword({
          identifier,
          password,
          captchaId,
          captchaAnswer,
        });
        await finishAuth(auth.accessToken, auth.refreshToken, Boolean(auth.newUser), auth.expiresIn);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <Pill tone="soft">{mode === "register" ? "Регистрация" : "Вход по паролю"}</Pill>
      <div className="mt-4 inline-flex rounded-full border border-[#f0dce8] bg-white p-1">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "login" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setMode("login")}
        >
          Вход
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "register" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setMode("register")}
        >
          Регистрация
        </button>
      </div>

      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        {mode === "register" ? (
          <>
            <FieldLabel>
              Логин (латиница, 3–32)
              <FieldInput value={login} onChange={(event) => setLogin(event.target.value)} required />
            </FieldLabel>
            <FieldLabel>
              Email (необязательно)
              <FieldInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </FieldLabel>
            <FieldLabel>
              Имя для отображения
              <FieldInput
                placeholder="Как вас показывать в приложении"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </FieldLabel>
            <FieldLabel>
              Пол
              <FieldSelect value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>
                <option value="">Не указан</option>
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
                <option value="other">Другой</option>
              </FieldSelect>
            </FieldLabel>
            <p className={mutedTextClassName}>Имя и пол можно изменить позже в настройках или на шаге создания avatar.</p>
          </>
        ) : (
          <FieldLabel>
            Логин или email
            <FieldInput value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          </FieldLabel>
        )}
        <FieldLabel>
          Пароль (мин. 8, буква + цифра)
          <FieldInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </FieldLabel>
        <MathCaptchaField
          api={api}
          captchaAnswer={captchaAnswer}
          captchaId={captchaId}
          onCaptchaAnswerChange={setCaptchaAnswer}
          onCaptchaIdChange={setCaptchaId}
        />
        <Button disabled={loading || !captchaId} size="lg" type="submit">
          {loading ? "Отправляем…" : mode === "register" ? "Создать аккаунт" : "Войти"}
        </Button>
      </form>
      {error ? <p className="mt-3 text-sm font-normal text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
