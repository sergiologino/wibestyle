"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";

const YANDEX_RED = "#FC3F1D";

function YandexLogo() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold leading-none"
      style={{ color: YANDEX_RED, fontFamily: "Arial, sans-serif" }}
    >
      Я
    </span>
  );
}

export default function OAuthButtons() {
  const { api } = useAppSession();
  const [providers, setProviders] = useState<{ yandex: boolean; google: boolean }>({ yandex: false, google: false });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.getOAuthProviders().then((data) => {
      setProviders({ yandex: data.yandex.enabled, google: data.google.enabled });
    }).catch(() => setProviders({ yandex: false, google: false }));
  }, [api]);

  async function start(provider: "yandex" | "google") {
    setLoading(provider);
    setError(null);
    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref") ?? undefined;
      const result = await api.startOAuth(provider, { referralCode });
      window.location.href = result.authorizationUrl;
    } catch {
      setError("OAuth временно недоступен — проверьте настройки провайдера");
      setLoading(null);
    }
  }

  if (!providers.yandex && !providers.google) {
    return null;
  }

  return (
    <Card>
      <p className="font-black text-[#302637]">Или войти через</p>
      <div className="mt-4 grid gap-2">
        {providers.yandex ? (
          <Button
            aria-label="Яндекс"
            className="gap-2.5 text-white shadow-[0_8px_22px_rgba(252,63,29,0.22)] hover:brightness-95"
            disabled={loading !== null}
            size="lg"
            style={{ backgroundColor: YANDEX_RED, borderColor: "transparent", color: "#ffffff" }}
            onClick={() => void start("yandex")}
          >
            <YandexLogo />
            <span>{loading === "yandex" ? "Переход…" : "Яндекс"}</span>
          </Button>
        ) : null}
        {providers.google ? (
          <Button disabled={loading !== null} size="lg" variant="secondary" onClick={() => void start("google")}>
            {loading === "google" ? "Переход…" : "Google"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm font-bold text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
