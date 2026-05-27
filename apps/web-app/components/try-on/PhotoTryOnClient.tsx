"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { GarmentCategory } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { inferGarmentCategory } from "@/lib/try-on-flow";

const categories: { id: GarmentCategory; label: string }[] = [
  { id: "dress", label: "Платье" },
  { id: "top", label: "Верх" },
  { id: "pants", label: "Брюки" },
  { id: "jacket", label: "Пиджак" },
  { id: "shoes", label: "Обувь" },
  { id: "other", label: "Другое" },
];

export default function PhotoTryOnClient() {
  const router = useRouter();
  const { api, profile, refreshProfile } = useAppSession();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [category, setCategory] = useState<GarmentCategory>("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setCategory(inferGarmentCategory(file.name));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall?reason=trial_exhausted");
      return;
    }
    if (!photoFile) {
      setError("Загрузите фото одежды");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.createPhotoTryOnSession(photoFile, category, "gallery_upload");
      const generated = await api.generateTryOn(created.session.id);
      await refreshProfile();
      router.push(`/try-on/result/${generated.session.id}`);
    } catch (err) {
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
      <Pill>Примерка по фото</Pill>
      <Card>
        <h1 className="text-3xl font-black tracking-tight">Загрузи фото одежды</h1>
        <p className="mt-3 font-bold text-[#6d6273]">
          Снимок из галереи или скрин карточки товара. Категорию можно поправить вручную.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <input
            accept="image/*"
            className="rounded-2xl border border-dashed border-[#ffb8e4] bg-[#fff8fd] px-4 py-8 font-bold text-[#6d6273]"
            type="file"
            onChange={onFileChange}
            required
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-black ${category === item.id ? "bg-[#ff1fa2] text-white" : "bg-[#fff4fb] text-[#6d6273]"}`}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {photoFile ? <p className="font-bold text-[#302637]">Файл: {photoFile.name}</p> : null}
          {error ? (
            <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-bold text-[#c01278]">{error}</p>
          ) : null}
          <Button disabled={loading} size="lg" type="submit">
            {loading ? "Генерируем look…" : "Примерить этот предмет"}
          </Button>
        </form>
      </Card>
      <Link href="/try-on" className="font-bold text-[#ff1fa2]">← Назад</Link>
    </div>
  );
}
