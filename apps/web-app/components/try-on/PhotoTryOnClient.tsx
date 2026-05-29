"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, StepIndicator } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { GarmentCategory, ProductPreview } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ProductPreviewImage from "@/components/try-on/ProductPreviewImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { formatTryOnError } from "@/lib/try-on-error-message";
import {
  GARMENT_CATEGORY_LABELS,
  buildPhotoProductPreview,
  inferGarmentCategory,
} from "@/lib/try-on-flow";

const steps = ["Фото", "Товар", "Размер", "Генерация"];

const categories = Object.entries(GARMENT_CATEGORY_LABELS).map(([id, label]) => ({
  id: id as GarmentCategory,
  label,
}));

export default function PhotoTryOnClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { api, profile, refreshProfile, accessToken, refreshToken, accessTokenExpiresAt, sessionReady, ensureSession } =
    useAppSession();
  const [step, setStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<GarmentCategory>("other");
  const [size, setSize] = useState("M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const product = useMemo<ProductPreview | null>(() => {
    if (!photoFile || !previewUrl || step < 1) {
      return null;
    }
    return buildPhotoProductPreview(photoFile, category, previewUrl);
  }, [photoFile, previewUrl, category, step]);

  function authRedirectPath() {
    const query = params.toString();
    const currentPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthRedirectPath(currentPath);
  }

  async function requireAuth(): Promise<boolean> {
    if (!sessionReady) {
      return false;
    }
    if (accessToken || refreshToken || profile) {
      const ok = await ensureSession();
      if (ok) {
        return true;
      }
    }
    router.push(authRedirectPath());
    return false;
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setCategory(inferGarmentCategory(file.name));
    setError(null);
  }

  function continueToPreview(event: FormEvent) {
    event.preventDefault();
    if (!photoFile) {
      setError("Загрузите фото одежды");
      return;
    }
    setError(null);
    setSize("M");
    setStep(1);
  }

  async function startGeneration() {
    if (!(await requireAuth())) {
      return;
    }

    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall?reason=trial_exhausted");
      return;
    }

    if (!photoFile) {
      setError("Загрузите фото одежды");
      setStep(0);
      return;
    }

    setStep(3);
    setLoading(true);
    setError(null);

    try {
      const created = await api.createPhotoTryOnSession(photoFile, category, "gallery_upload", size);
      const generated = await api.generateTryOn(created.session.id);
      await refreshProfile();
      if (generated.session.status === "failed") {
        setStep(2);
        setError(formatTryOnError(generated.session));
        return;
      }
      router.push(`/try-on/result/${created.session.id}`);
    } catch (err) {
      setStep(2);
      if (err instanceof ApiError && err.status === 401) {
        const restored = await ensureSession();
        if (restored) {
          setError("Сессия обновлена. Запустите примерку ещё раз.");
          return;
        }
        setError("Сессия истекла. Войди снова, чтобы запустить примерку.");
        router.push(authRedirectPath());
        return;
      }
      if (err instanceof ApiError && err.code === "INSUFFICIENT_GENERATIONS") {
        router.push("/paywall?reason=trial_exhausted");
        return;
      }
      if (err instanceof ApiError && err.code === "AVATAR_NOT_READY") {
        router.push("/onboarding/avatar");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Не удалось запустить примерку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-display text-3xl">Примерка по фото</h1>
        <p className="text-body mt-2">Загрузи снимок одежды — посмотри превью, выбери размер и запусти примерку.</p>
      </div>
      <StepIndicator current={step} steps={steps} />

      {step === 0 ? (
        <Card>
          <h2 className="text-display-md text-2xl">Загрузи фото одежды</h2>
          <p className="text-body mt-3">
            Снимок из галереи или скрин карточки товара. Категорию можно поправить на следующем шаге.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={continueToPreview}>
            <input
              accept="image/*"
              className="rounded-2xl border border-dashed border-[#ffb8e4] bg-[#fff8fd] px-4 py-8 font-normal text-[#6d6273]"
              type="file"
              onChange={onFileChange}
              required
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium ${category === item.id ? "bg-[#ff1fa2] text-white" : "bg-[#fff4fb] text-[#6d6273]"}`}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {photoFile ? <p className="font-normal text-[#302637]">Файл: {photoFile.name}</p> : null}
            <Button disabled={!photoFile || loading} size="md" type="submit">
              Продолжить
            </Button>
          </form>
        </Card>
      ) : null}

      {step >= 1 && product ? (
        <Card>
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <ProductPreviewImage
              imageUrl={product.imageUrl}
              alt={product.title}
              className="aspect-[3/4] w-full rounded-[22px] object-cover shadow-sm"
            />
            <div>
              <p className="text-eyebrow text-[#782cff]">{product.brand}</p>
              <h2 className="text-display-md mt-2 text-2xl">{product.title}</h2>
              {photoFile ? (
                <p className="mt-2 text-sm font-normal text-[#6d6273]">{photoFile.name}</p>
              ) : null}

              {step === 1 ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                  <h3 className="text-display-md text-lg">Категория вещи</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === item.id ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
                        onClick={() => setCategory(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step >= 2 ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                  <h3 className="text-display-md text-lg">Какой размер примерить?</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${size === item ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
                        onClick={() => setSize(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {step === 1 ? (
            <Button
              className="mt-6"
              size="md"
              onClick={() => {
                void (async () => {
                  if (!(await requireAuth())) return;
                  setStep(2);
                })();
              }}
            >
              Выбрать размер
            </Button>
          ) : null}

          {step === 2 && sessionReady && !isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <p className="mt-6 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
              Чтобы запустить примерку,{" "}
              <Link href={authRedirectPath()} className="text-link">
                войди в аккаунт
              </Link>
              .
            </p>
          ) : null}

          {step === 2 && sessionReady && isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <Button className="mt-6" disabled={loading} size="md" onClick={startGeneration}>
              Запустить AI-примерку
            </Button>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <h3 className="text-display-md text-xl">Собираем твой look…</h3>
          <p className="text-body mt-2">Нейростилист надевает {product?.title ?? "вещь"} на твой образ…</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#ff1fa2]" />
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-normal text-[#c01278]">{error}</p>
      ) : null}

      <Link href="/try-on" className="text-link text-sm">
        ← Назад к выбору сценария
      </Link>
    </div>
  );
}
