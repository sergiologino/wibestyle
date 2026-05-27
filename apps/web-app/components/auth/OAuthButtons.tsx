"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";

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
      const result = await api.startOAuth(provider);
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
          <Button disabled={loading !== null} size="lg" variant="secondary" onClick={() => void start("yandex")}>
            {loading === "yandex" ? "Переход…" : "Яндекс ID"}
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
