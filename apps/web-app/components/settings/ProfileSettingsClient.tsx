"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { BillingSubscription, InterfacePalette, UpdateProfilePayload } from "@wibestyle/shared-types";
import { useAppSession, useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import AvatarManager from "@/components/avatar/AvatarManager";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import AnthropometryFields from "@/components/profile/AnthropometryFields";
import TelegramChannelButton from "@/components/community/TelegramChannelButton";
import { isPaidSubscription } from "@/lib/billing-plan";
import { legalLinks } from "@/lib/legal-links";
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  mutedTextClassName,
  sectionTitleClassName,
} from "@/components/ui/fields";

const interfacePaletteOptions: Array<{
  value: InterfacePalette;
  label: string;
  description: string;
  swatches: string[];
}> = [
  {
    value: "vibe",
    label: "Vibe pink",
    description: "Розовый и фиолетовый — текущий фирменный стиль.",
    swatches: ["#ff1fa2", "#782cff", "#fff4fb"],
  },
  {
    value: "pistachio",
    label: "Фисташка",
    description: "Тёплый бежевый фон и спокойный зелёный акцент.",
    swatches: ["#7a9b56", "#b78347", "#f8f6ec"],
  },
  {
    value: "graphite",
    label: "Графит",
    description: "Нейтральная светлая схема с сине-графитовым акцентом.",
    swatches: ["#42677f", "#8a6f58", "#f4f7f8"],
  },
];

export default function ProfileSettingsClient() {
  const router = useRouter();
  const { api, profile, accessToken, phone, logout, refreshProfile } = useAppSession();
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [interfacePalette, setInterfacePalette] = useState<InterfacePalette>("vibe");
  const [heightCm, setHeightCm] = useState("");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [clothingSize, setClothingSize] = useState("M");
  const [shoeSizeEu, setShoeSizeEu] = useState("");
  const [hideFace, setHideFace] = useState(true);
  const [hideBackground, setHideBackground] = useState(false);
  const [activeAvatarPhotoPath, setActiveAvatarPhotoPath] = useState<string | null>(null);
  const [activeAvatarPreviewUrl, setActiveAvatarPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null);
  const [autoRenewSaving, setAutoRenewSaving] = useState(false);
  const [paletteSaving, setPaletteSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setGender(profile.gender ?? "");
    setInterfacePalette(profile.interfacePalette ?? "vibe");
    setHideFace(profile.privacy?.faceHidden ?? true);
    setHideBackground(profile.privacy?.backgroundHidden ?? false);
    setHeightCm(profile.anthropometry?.heightCm ? String(profile.anthropometry.heightCm) : "");
    setBustCm(profile.anthropometry?.bustCm ? String(profile.anthropometry.bustCm) : "");
    setWaistCm(profile.anthropometry?.waistCm ? String(profile.anthropometry.waistCm) : "");
    setHipsCm(profile.anthropometry?.hipsCm ? String(profile.anthropometry.hipsCm) : "");
    setClothingSize(profile.anthropometry?.clothingSize ?? "M");
    setShoeSizeEu(profile.anthropometry?.shoeSizeEu ? String(profile.anthropometry.shoeSizeEu) : "");
  }, [profile]);

  useEffect(() => {
    const previousPalette = document.documentElement.dataset.interfacePalette ?? "vibe";
    document.documentElement.dataset.interfacePalette = interfacePalette;
    return () => {
      document.documentElement.dataset.interfacePalette = profile?.interfacePalette ?? previousPalette;
    };
  }, [interfacePalette, profile?.interfacePalette]);

  useEffect(() => {
    if (!accessToken || !isPaidSubscription(profile)) return;
    void api.getBillingSubscription().then(setBillingSubscription).catch(() => undefined);
  }, [accessToken, api, profile]);

  async function toggleAutoRenew() {
    if (!billingSubscription) return;
    setAutoRenewSaving(true);
    setError(null);
    try {
      setBillingSubscription(await api.setAutoRenew(!billingSubscription.autoRenewEnabled));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось изменить автопродление");
    } finally {
      setAutoRenewSaving(false);
    }
  }

  useEffect(() => {
    if (!accessToken || !profile?.activeAvatarId) {
      setActiveAvatarPhotoPath(null);
      return;
    }
    let cancelled = false;
    void api.listAvatars().then(({ items }) => {
      if (cancelled) return;
      const active = items.find((item) => item.id === profile.activeAvatarId);
      setActiveAvatarPhotoPath(active?.photoProcessedUrl ?? active?.photoOriginalUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, profile?.activeAvatarId]);

  const activeAvatarBlobUrl = useAuthenticatedBlob(activeAvatarPhotoPath);
  useEffect(() => {
    setActiveAvatarPreviewUrl(activeAvatarBlobUrl);
  }, [activeAvatarBlobUrl]);

  function onLogout() {
    logout();
    router.replace("/welcome");
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: UpdateProfilePayload = {
      displayName: displayName.trim() || undefined,
      gender: gender || undefined,
      interfacePalette,
      heightCm: heightCm ? Number(heightCm) : undefined,
      bustCm: bustCm ? Number(bustCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      clothingSize,
      shoeSizeEu: shoeSizeEu ? Number(shoeSizeEu) : undefined,
      privacyFaceHidden: hideFace,
      privacyBackgroundHidden: hideBackground,
      privacyFeaturesHidden: false,
    };
    try {
      await api.updateProfile(payload);
      await refreshProfile();
      setMessage("Профиль сохранён");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function saveInterfacePalette(nextPalette: InterfacePalette) {
    if (paletteSaving || nextPalette === interfacePalette) return;
    const previousPalette = interfacePalette;
    setPaletteSaving(true);
    setError(null);
    setMessage(null);
    setInterfacePalette(nextPalette);
    try {
      await api.updateProfile({ interfacePalette: nextPalette });
      await refreshProfile();
      setMessage("Палитра сохранена");
    } catch (err) {
      setInterfacePalette(profile?.interfacePalette ?? previousPalette);
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить палитру");
    } finally {
      setPaletteSaving(false);
    }
  }

  async function onDeleteAccount(event: FormEvent) {
    event.preventDefault();
    if (confirmDelete !== "УДАЛИТЬ") {
      setError('Введите слово «УДАЛИТЬ» для подтверждения');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount("DELETE");
      logout();
      router.replace("/welcome");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить аккаунт");
      setDeleting(false);
    }
  }

  const genderLabel =
    gender === "female" ? "Женский" : gender === "male" ? "Мужской" : gender === "other" ? "Другой" : "Не указан";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="app-surface rounded-[32px] p-6">
        <h1 className="text-display text-4xl">Профиль</h1>
        <div className="mt-4 grid gap-1 text-sm font-normal text-[#6d6273]">
          {displayName ? <p>Имя: {displayName}</p> : null}
          {phone ? <p>Аккаунт: {phone}</p> : null}
          <p>Пол: {genderLabel}</p>
          {profile ? (
            <p>
              Тариф: {profile.plan.toUpperCase()}
              {profile.plan === "trial" ? ` · осталось ${profile.trialGenerationsLeft} примерок` : ""}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <TelegramChannelButton />
          <Button size="md" type="button" variant="secondary" onClick={onLogout}>
            Выйти из профиля
          </Button>
        </div>
      </section>

      <Card>
        <p className={sectionTitleClassName}>Подписка</p>
        {profile ? (
          <div className="mt-3 space-y-2 text-sm text-[#6d6273]">
            <p>
              Тариф: <strong className="text-[#302637]">{profile.plan.toUpperCase()}</strong>
              {profile.billingPeriod ? ` · ${profile.billingPeriod === "annual" ? "год" : "месяц"}` : ""}
            </p>
            {profile.plan === "trial" ? (
              <>
                <p>Бесплатных примерок осталось: {profile.trialGenerationsLeft}</p>
                <p>Бесплатных видео осталось: {profile.trialVideoGenerationsLeft ?? 0}</p>
              </>
            ) : profile.planGenerationsLeft != null ? (
              <p>Генераций в периоде: {profile.planGenerationsLeft}</p>
            ) : null}
            {profile.bonusGenerationsLeft ? (
              <p>Дополнительных примерок: {profile.bonusGenerationsLeft}</p>
            ) : null}
            {profile.subscriptionExpiresAt ? (
              <p>Действует до: {new Date(profile.subscriptionExpiresAt).toLocaleDateString("ru-RU")}</p>
            ) : null}
            {billingSubscription?.paymentMethodSaved ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-3">
                <div className="flex-1">
                  <p className="font-medium text-[#302637]">Автопродление</p>
                  <p className="mt-1 text-xs">
                    {billingSubscription.autoRenewEnabled
                      ? "Включено. Предупредим за 3 дня до следующего списания."
                      : "Отключено. Подписка завершится в указанную дату."}
                  </p>
                </div>
                <Button size="sm" variant="secondary" disabled={autoRenewSaving} onClick={() => void toggleAutoRenew()}>
                  {billingSubscription.autoRenewEnabled ? "Отключить" : "Включить"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        <Link href={isPaidSubscription(profile) ? "/paywall?reason=elite_perk" : "/paywall"}>
          <Button className="mt-4" size="md" variant={isPaidSubscription(profile) ? "secondary" : "primary"}>
            {isPaidSubscription(profile) ? "Upgrade на Elite" : "Оформить подписку"}
          </Button>
        </Link>
        <Link href="/referrals" className="mt-3 inline-flex font-medium text-[var(--pink)]">
          Реферальная программа и история начислений →
        </Link>
      </Card>

      <Card>
        <p className={sectionTitleClassName}>Палитра интерфейса</p>
        <p className={`mt-1 ${mutedTextClassName}`}>
          Выбери цветовую гамму приложения. Текущая розово-фиолетовая остается доступной.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {interfacePaletteOptions.map((option) => {
            const active = interfacePalette === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={paletteSaving}
                onClick={() => void saveInterfacePalette(option.value)}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? "border-[var(--pink)] bg-[var(--pink-bg)] shadow-[0_10px_28px_var(--pink-glow)]"
                    : "border-[var(--pink-soft)] bg-white hover:border-[var(--pink)]"
                } disabled:cursor-wait disabled:opacity-70`}
              >
                <span className="flex gap-2">
                  {option.swatches.map((swatch) => (
                    <span key={swatch} className="h-6 w-9 rounded-full" style={{ backgroundColor: swatch }} />
                  ))}
                </span>
                <span className="mt-3 block font-medium text-[var(--black)]">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{option.description}</span>
                {active ? (
                  <span className="mt-3 block text-xs font-medium text-[var(--pink)]">
                    {paletteSaving ? "Сохраняем..." : "Выбрано"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="grid gap-6">
          <div>
            <p className={sectionTitleClassName}>Основной avatar</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Текущий образ для примерки и настройки приватности.</p>
          </div>
          <AvatarPrivacyPreview
            localPreviewUrl={activeAvatarPreviewUrl}
            privacy={{ hideFace, hideBackground, hideFeatures: false }}
            onPrivacyChange={(next) => {
              if (next.hideFace !== undefined) setHideFace(next.hideFace);
              if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
            }}
          />
        </div>
      </Card>

      <Card>
        <AvatarManager activeAvatarId={profile?.activeAvatarId} />
      </Card>

      <Card>
        <form className="grid gap-6" onSubmit={onSave}>
          <div>
            <p className={sectionTitleClassName}>Данные профиля</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Имя, пол и размеры для новых avatar.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel>
              Имя для отображения
              <FieldInput maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
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
          </div>

          <div>
            <p className={`${sectionTitleClassName} mb-3`}>Антропометрия</p>
            <AnthropometryFields
              bustCm={bustCm}
              clothingSize={clothingSize}
              heightCm={heightCm}
              hipsCm={hipsCm}
              shoeSizeEu={shoeSizeEu}
              waistCm={waistCm}
              onChange={(field, value) => {
                if (field === "heightCm") setHeightCm(value);
                if (field === "bustCm") setBustCm(value);
                if (field === "waistCm") setWaistCm(value);
                if (field === "hipsCm") setHipsCm(value);
                if (field === "clothingSize") setClothingSize(value);
                if (field === "shoeSizeEu") setShoeSizeEu(value);
              }}
            />
          </div>

          <Button disabled={saving} size="md" type="submit">
            {saving ? "Сохраняем…" : "Сохранить профиль"}
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm font-normal text-[#782cff]">{message}</p> : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-[#c01278]">Удалить аккаунт</h2>
        <p className={`mt-2 ${mutedTextClassName}`}>
          Безвозвратно удалятся профиль, avatar, примерки, посты и медиа. Это действие нельзя отменить.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={onDeleteAccount}>
          <FieldInput
            placeholder='Введите «УДАЛИТЬ»'
            value={confirmDelete}
            onChange={(event) => setConfirmDelete(event.target.value)}
          />
          <Button disabled={deleting} size="md" type="submit" variant="secondary">
            {deleting ? "Удаляем…" : "Удалить аккаунт навсегда"}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm font-normal text-[#ff1fa2]">{error}</p> : null}

      <Link href="/home" className="text-sm font-medium text-[#ff1fa2]">
        ← На главную
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-normal text-[#9a8f99]">
        <a className="text-[#ff1fa2]" href={legalLinks.privacy} target="_blank" rel="noreferrer">
          Политика конфиденциальности
        </a>
        <a className="text-[#ff1fa2]" href={legalLinks.terms} target="_blank" rel="noreferrer">
          Пользовательское соглашение
        </a>
      </div>
    </div>
  );
}
