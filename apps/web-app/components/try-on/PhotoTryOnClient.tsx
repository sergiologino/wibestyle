"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, StepIndicator } from "@wibestyle/ui";
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

const steps = ["Фото", "Размер", "Генерация"];

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
  const [garmentTitle, setGarmentTitle] = useState("");
  const [classificationSource, setClassificationSource] = useState<"ai" | "fallback" | null>(null);
  const [size, setSize] = useState("M");
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
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
    return buildPhotoProductPreview(photoFile, category, previewUrl, garmentTitle);
  }, [photoFile, previewUrl, category, garmentTitle, step]);

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
    setError(null);
    setClassificationSource(null);
    setGarmentTitle("");
  }

  async function continueToPreview(event: FormEvent) {
    event.preventDefault();
    if (!photoFile) {
      setError("Загрузите фото одежды");
      return;
    }

    setError(null);
    setClassifying(true);
    setSize("M");

    try {
      const { classification } = await api.classifyGarmentPhoto(photoFile);
      setCategory(classification.category);
      setGarmentTitle(classification.title);
      setClassificationSource(classification.source ?? "ai");
      setStep(1);
    } catch {
      const fallbackCategory = inferGarmentCategory(photoFile.name);
      setCategory(fallbackCategory);
      setGarmentTitle(GARMENT_CATEGORY_LABELS[fallbackCategory]);
      setClassificationSource("fallback");
      setStep(1);
    } finally {
      setClassifying(false);
    }
  }

  async function startGeneration() {
    if (!(await requireAuth())) {
      return;
    }

    if (!product || !size || !product.sizes.includes(size)) {
      setError("Выберите размер перед запуском примерки");
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

    setStep(2);
    setLoading(true);
    setError(null);

    try {
      const created = await api.createPhotoTryOnSession(
        photoFile,
        category,
        "gallery_upload",
        size,
        garmentTitle || product.title,
      );
      const generated = await api.generateTryOn(created.session.id);
      await refreshProfile();
      if (generated.session.status === "failed") {
        setStep(1);
        setError(formatTryOnError(generated.session));
        return;
      }
      router.push(`/try-on/result/${created.session.id}`);
    } catch (err) {
      setStep(1);
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
      if (err instanceof ApiError && err.code === "PROFILE_GENDER_REQUIRED") {
        router.push("/settings?setup=try-on");
        return;
      }
      if (err instanceof ApiError && err.code === "ANTHROPOMETRY_REQUIRED") {
        router.push("/settings?setup=try-on");
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
        <p className="text-body mt-2">Загрузи снимок — AI определит вещь, выбери размер и запусти примерку.</p>
      </div>
      <StepIndicator current={step} steps={steps} />

      {step === 0 ? (
        <Card>
          <h2 className="text-display-md text-2xl">Загрузи фото одежды</h2>
          <p className="text-body mt-3">
            Снимок из галереи или скрин карточки товара. Тип вещи определится автоматически.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={(event) => void continueToPreview(event)}>
            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#ffb8e4] bg-[#fff8fd] px-5 py-3 text-sm font-medium text-[#ff1fa2] transition hover:border-[#ff1fa2] hover:bg-[#fff0f8]">
              <input
                accept="image/*"
                className="sr-only"
                type="file"
                onChange={onFileChange}
                required
              />
              {photoFile ? "Выбрать другое фото" : "Выбрать фото"}
            </label>
            {photoFile && previewUrl ? (
              <div className="flex items-center gap-4 rounded-2xl border border-[#ffd1ed] bg-white p-3">
                <ProductPreviewImage
                  imageUrl={previewUrl}
                  alt="Выбранное фото одежды"
                  className="h-24 w-20 rounded-xl object-cover"
                />
                <div>
                  <p className="font-medium text-[#302637]">Фото выбрано</p>
                  <p className="mt-1 text-sm font-normal text-[#6d6273]">Можно продолжать к выбору размера</p>
                </div>
              </div>
            ) : null}
            <button
              type="submit"
              data-testid="photo-try-on-continue"
              disabled={!photoFile || classifying}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff1fa2] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)] transition hover:bg-[#eb1692] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[#f3c5df] disabled:shadow-none"
            >
              {classifying ? (
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              <span>{classifying ? "Определяем вещь…" : "Продолжить к примерке"}</span>
            </button>
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
              {classificationSource === "ai" ? (
                <p className="mt-2 text-sm font-normal text-[#782cff]">Определено AI по фото</p>
              ) : null}
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
            </div>
          </div>

          {step >= 1 && sessionReady && !isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <p className="mt-6 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
              Чтобы запустить примерку,{" "}
              <Link href={authRedirectPath()} className="text-link">
                войди в аккаунт
              </Link>
              .
            </p>
          ) : null}

          {step >= 1 && sessionReady && isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <button
              type="button"
              data-testid="photo-try-on-start"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ff1fa2] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)] transition hover:bg-[#eb1692] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[#f3c5df] disabled:shadow-none"
              disabled={loading || !size || !product.sizes.includes(size)}
              onClick={() => void startGeneration()}
            >
              Примерить эту вещь
            </button>
          ) : null}
        </Card>
      ) : null}

      {step === 2 ? (
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
