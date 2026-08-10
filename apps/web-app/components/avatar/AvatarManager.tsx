"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarRecord } from "@wibestyle/shared-types";
import { MAX_AVATARS_PER_USER } from "@wibestyle/shared-types";
import { ApiError } from "@wibestyle/api-client";
import { Button, Pill } from "@wibestyle/ui";
import { useAppSession, useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import { FieldInput, mutedTextClassName } from "@/components/ui/fields";

function AvatarThumb({
  avatar,
  active,
  onSelect,
  onDelete,
  onEnhance,
  busy,
}: {
  avatar: AvatarRecord;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEnhance: () => void;
  busy: boolean;
}) {
  const photoPath = avatar.photoProcessedUrl ?? avatar.photoOriginalUrl;
  const thumbUrl = useAuthenticatedBlob(photoPath);
  const warnings = Array.isArray(avatar.warnings) ? avatar.warnings : [];
  const showEnhancementHint = avatar.enhancementRecommended || warnings.length > 0;

  return (
    <div
      className={`relative w-full max-w-[240px] overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${
        active ? "border-[#ff1fa2] ring-2 ring-[#ff1fa2]/20" : "border-[#f0dce8]"
      }`}
    >
      <div className="aspect-[3/4] bg-[#faf5f9]">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="size-full object-cover" src={thumbUrl} />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[#a89aad]">Нет фото</div>
        )}
      </div>
      <div className="grid gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {active ? <Pill tone="soft">По умолчанию</Pill> : null}
          {showEnhancementHint ? <Pill tone="soft">Можно улучшить</Pill> : null}
        </div>
        {showEnhancementHint ? (
          <p className="text-xs leading-5 text-[#6d6273]">
            Фото подходит для примерки. Улучшение может сделать фон спокойнее и кадр чище.
          </p>
        ) : null}
        <div className="grid gap-2">
          {avatar.enhancementRecommended ? (
            <Button disabled={busy} size="sm" type="button" variant="secondary" onClick={onEnhance}>
              Улучшить фото
            </Button>
          ) : null}
          {!active ? (
            <Button disabled={busy} size="sm" type="button" variant="secondary" onClick={onSelect}>
              Сделать основным
            </Button>
          ) : null}
          {!active && avatar.status !== "DELETED" ? (
            <Button disabled={busy} size="sm" type="button" variant="secondary" onClick={onDelete}>
              Удалить
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AvatarEnhancementPanel({
  avatar,
  busy,
  onApply,
  onRevert,
}: {
  avatar: AvatarRecord;
  busy: boolean;
  onApply: () => void;
  onRevert: () => void;
}) {
  const originalUrl = useAuthenticatedBlob(avatar.photoOriginalUrl);
  const enhancedUrl = useAuthenticatedBlob(avatar.photoEnhancedUrl);
  if (!enhancedUrl) return null;

  return (
    <section className="rounded-[28px] border border-[#f0dce8] bg-[#fff8fd] p-4">
      <h3 className="text-base font-semibold text-[#302637]">Сравните варианты</h3>
      <p className="mt-1 text-sm leading-5 text-[#6d6273]">Улучшаем только свет, резкость, шум и фон. Лицо, фигура и одежда не должны меняться.</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <figure className="overflow-hidden rounded-2xl bg-white">
          {originalUrl ? <img alt="Исходное фото" className="aspect-[3/4] w-full object-cover" src={originalUrl} /> : null}
          <figcaption className="p-2 text-xs text-[#6d6273]">Исходное</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-2xl bg-white">
          <img alt="Улучшенное фото" className="aspect-[3/4] w-full object-cover" src={enhancedUrl} />
          <figcaption className="p-2 text-xs text-[#6d6273]">Улучшенное</figcaption>
        </figure>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} type="button" onClick={onApply}>Использовать улучшенный</Button>
        <Button disabled={busy} type="button" variant="secondary" onClick={onRevert}>Оставить исходный</Button>
      </div>
    </section>
  );
}

type AvatarManagerProps = {
  activeAvatarId?: string | null;
};

export default function AvatarManager({ activeAvatarId }: AvatarManagerProps) {
  const { api, accessToken, refreshProfile } = useAppSession();
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [hideFace, setHideFace] = useState(false);
  const [hideBackground, setHideBackground] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [adding, setAdding] = useState(false);
  const [avatarGuidance, setAvatarGuidance] = useState<{ title?: string; message?: string } | null>(null);
  const [enhancementAvatar, setEnhancementAvatar] = useState<AvatarRecord | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setLoading(true);
    try {
      const { items } = await api.listAvatars();
      setAvatars(items.filter((item) => item.status === "READY"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить аватары");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [api]);

  useEffect(() => {
    if (!newPhoto) {
      setNewPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newPhoto);
    setNewPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newPhoto]);

  async function activateAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.activateAvatar(avatarId);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось активировать аватар");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAvatar(avatarId);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить аватар");
    } finally {
      setBusy(false);
    }
  }

  async function enhanceAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      const { avatar } = await api.enhanceAvatar(avatarId);
      setEnhancementAvatar(avatar);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось улучшить фото");
    } finally {
      setBusy(false);
    }
  }

  async function applyEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setError(null);
    try {
      await api.applyAvatarEnhancement(enhancementAvatar.id);
      try {
        await api.activateAvatar(enhancementAvatar.id);
      } catch (err) {
        if (!(err instanceof ApiError) || err.code !== "ANTHROPOMETRY_REQUIRED") {
          throw err;
        }
        setAvatarGuidance({
          title: "Улучшенное фото сохранено",
          message: "Чтобы сделать аватар основным, укажите рост, грудь, талию и бёдра.",
        });
      }
      setEnhancementAvatar(null);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось применить улучшенный вариант");
    } finally {
      setBusy(false);
    }
  }

  async function revertEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setError(null);
    try {
      await api.revertAvatarEnhancement(enhancementAvatar.id);
      if (enhancementAvatar.active) await api.activateAvatar(enhancementAvatar.id);
      setEnhancementAvatar(null);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось вернуть исходный вариант");
    } finally {
      setBusy(false);
    }
  }

  async function addAvatar() {
    if (!newPhoto) {
      setError("Выберите фото для нового аватара");
      return;
    }
    setBusy(true);
    setError(null);
    setAvatarGuidance(null);
    let createdAvatarId: string | null = null;
    let avatarActivated = false;
    let reachedReadyState = false;
    try {
      const { avatar } = await api.createAvatar({
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      });
      createdAvatarId = avatar.id;
      await api.uploadAvatarPhoto(avatar.id, newPhoto);
      const validation = await api.validateAvatar(avatar.id);
      if (validation.recommendedAction === "replace_photo" || validation.avatar.status === "VALIDATION_FAILED") {
        setAvatarGuidance({ title: validation.guidanceTitle, message: validation.guidanceMessage });
        setNewPhoto(null);
        return;
      }
      await api.preprocessAvatar(avatar.id);
      reachedReadyState = true;
      try {
        await api.activateAvatar(avatar.id);
        avatarActivated = true;
      } catch (err) {
        if (!(err instanceof ApiError) || err.code !== "ANTHROPOMETRY_REQUIRED") {
          throw err;
        }
        setAvatarGuidance({
          title: "Аватар сохранён",
          message: "Чтобы сделать его основным, укажите рост, грудь, талию и бёдра.",
        });
      }
      setNewPhoto(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      if (createdAvatarId && !avatarActivated && !reachedReadyState) {
        await api.deleteAvatar(createdAvatarId).catch(() => undefined);
      }
      if (reachedReadyState) {
        await reload();
      }
      setError(err instanceof ApiError ? err.message : "Не удалось добавить аватар");
    } finally {
      setBusy(false);
    }
  }

  const readyAvatarCount = avatars.filter((avatar) => avatar.status === "READY").length;
  const atAvatarLimit = readyAvatarCount >= MAX_AVATARS_PER_USER;
  const needsFirstAvatar = !activeAvatarId && readyAvatarCount === 0;
  const visibleAvatars = avatars.filter((avatar) => avatar.status === "READY");

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#302637]">{needsFirstAvatar ? "Ваш первый аватар" : "Мои аватары"}</h2>
          <p className={`mt-1 max-w-xl text-xs leading-5 ${mutedTextClassName}`}>
            До {MAX_AVATARS_PER_USER} образов одного человека на аккаунт. Антропометрия общая для всех аватаров.
          </p>
        </div>
        {!needsFirstAvatar ? <Button
          disabled={atAvatarLimit || needsFirstAvatar}
          size="md"
          type="button"
          variant="secondary"
          onClick={() => setAdding((value) => !value)}
        >
          {adding ? "Отмена" : "+ Новый аватар"}
        </Button>
        : null}
      </div>

      {atAvatarLimit ? (
        <p className="rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
          Достигнут лимит — {MAX_AVATARS_PER_USER} аватара. Удалите неиспользуемый, чтобы добавить новый.
        </p>
      ) : null}

      {adding || needsFirstAvatar ? (
        <div className="rounded-[28px] border border-[#f0dce8] bg-gradient-to-br from-white to-[#fff8fd] p-4 shadow-sm">
          {needsFirstAvatar ? <p className="mb-2 text-sm font-medium text-[#302637]">Добавить фото</p> : null}
          <FieldInput
            accept="image/*"
            className="cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[#ff1fa2]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#ff1fa2]"
            ref={photoInputRef}
            type="file"
            onChange={(event) => {
              setAvatarGuidance(null);
              setNewPhoto(event.target.files?.[0] ?? null);
              // Permit choosing the same file again after a validation response.
              event.target.value = "";
            }}
          />
          <div className="mt-4">
            <AvatarPrivacyPreview
              localPreviewUrl={newPreviewUrl}
              privacy={{ hideFace, hideBackground, hideFeatures: false }}
              processing={busy}
              onSelectPhoto={() => photoInputRef.current?.click()}
              onPrivacyChange={(next) => {
                if (next.hideFace !== undefined) setHideFace(next.hideFace);
                if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
              }}
              primaryAction={newPhoto ? (
                <Button disabled={busy} size="lg" type="button" onClick={() => void addAvatar()}>
                  {busy ? "Загружаем…" : needsFirstAvatar ? "Создать аватар" : "Сохранить новый аватар"}
                </Button>
              ) : null}
            />
          </div>
          {avatarGuidance?.message ? (
            <div className="mt-4 rounded-2xl border border-[#ffd1ed] bg-[#fff4fb] p-4">
              <p className="font-medium text-[#302637]">{avatarGuidance.title ?? "Подберём кадр, на котором примерка получится точнее"}</p>
              <p className="mt-1 text-sm leading-5 text-[#6d6273]">{avatarGuidance.message}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? <p className={mutedTextClassName}>Загружаем аватары…</p> : null}

      {enhancementAvatar ? (
        <AvatarEnhancementPanel avatar={enhancementAvatar} busy={busy} onApply={() => void applyEnhancement()} onRevert={() => void revertEnhancement()} />
      ) : null}

      {!loading && visibleAvatars.length === 0 ? (
        <p className={mutedTextClassName}>Аватары пока не готовы.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAvatars.map((avatar) => (
            <AvatarThumb
              key={avatar.id}
              active={avatar.active}
              avatar={avatar}
              busy={busy}
              onDelete={() => void deleteAvatar(avatar.id)}
              onEnhance={() => void enhanceAvatar(avatar.id)}
              onSelect={() => void activateAvatar(avatar.id)}
            />
          ))}
        </div>
      )}

      {error ? <p className="text-sm font-normal text-[#c01278]">{error}</p> : null}
    </div>
  );
}
