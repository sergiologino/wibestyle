"use client";

import { useEffect, useState } from "react";
import ApiImage from "@/components/media/ApiImage";
import { useAppSession } from "@/components/providers/AppSessionProvider";

const PORTRAIT_URL = "/api/v1/profile/hairstyle-portrait/image";

export default function HairstylePortraitManager() {
  const { api, ensureSession, sessionReady, accessToken, refreshToken, profile } = useAppSession();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionReady || !(accessToken || refreshToken || profile)) {
      return;
    }
    let cancelled = false;
    void ensureSession().then((ok) => {
      if (!ok || cancelled) return;
      void api.getHairstylePortrait()
        .then((result) => {
          if (!cancelled && result.exists) {
            setUrl(`${result.imageUrl ?? PORTRAIT_URL}?v=${Date.now()}`);
          }
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, ensureSession, profile, refreshToken, sessionReady]);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await ensureSession())) {
        setError("Войдите в аккаунт, чтобы сохранить портрет.");
        return;
      }
      const result = await api.uploadHairstylePortrait(file);
      setUrl(`${result.imageUrl ?? PORTRAIT_URL}?v=${Date.now()}`);
    } catch {
      setError("Не удалось загрузить портрет. Попробуйте другое фото.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <section className="rounded-[24px] border border-[#ffd1ed] bg-white p-5">
      <h2 className="text-display-md text-2xl">Портрет для причёсок</h2>
      <p className="text-body mt-2">Отдельный крупный портрет от макушки до плеч. Он не заменяет аватар для одежды.</p>
      {url ? (
        <ApiImage src={url} alt="Портрет для причёсок" className="mt-4 size-32 rounded-2xl object-cover" />
      ) : null}
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-[#fff4fb] px-4 py-3 text-sm font-medium text-[#ff1fa2]">
        <input type="file" accept="image/*" className="sr-only" onChange={pick} />
        {busy ? "Загружаем…" : url ? "Заменить портрет" : "Загрузить портрет"}
      </label>
      {error ? <p className="mt-3 text-sm font-normal text-[#c01278]">{error}</p> : null}
    </section>
  );
}
