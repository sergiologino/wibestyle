"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarRecord } from "@wibestyle/shared-types";
import { MAX_AVATARS_PER_USER } from "@wibestyle/shared-types";
import { ApiError } from "@wibestyle/api-client";
import { Button, Pill } from "@wibestyle/ui";
import { useAppSession, useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import { TryOnBeforeAfter } from "@/components/try-on/TryOnResultImages";
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
  const canEnhance = !avatar.useEnhancedPhoto && avatar.enhancementRecommended;
  const showEnhancementHint = !avatar.useEnhancedPhoto && (avatar.enhancementRecommended || warnings.length > 0);

  return (
    <div
      className={`relative w-full max-w-[280px] overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${
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
          {canEnhance ? (
            <Button disabled={busy} size="sm" type="button" variant="secondary" onClick={onEnhance}>
              Улучшить аватар
            </Button>
          ) : null}
          {!active ? (
            <Button disabled={busy} size="sm" type="button" variant="secondary" onClick={onSelect}>
              {showEnhancementHint ? "Сохранить этот вариант" : "Сделать основным"}
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

function FeaturedAvatarPanel({
  avatar,
  accessToken,
}: {
  avatar: AvatarRecord;
  accessToken?: string | null;
}) {
  return (
    <section className="rounded-[28px] border border-[#f0dce8] bg-gradient-to-br from-white to-[#fff8fd] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {avatar.active ? <Pill tone="soft">По умолчанию</Pill> : <Pill tone="soft">Сохранён</Pill>}
        {avatar.useEnhancedPhoto ? <Pill tone="soft">Улучшенный</Pill> : null}
      </div>
      <AvatarPrivacyPreview
        accessToken={accessToken}
        privacy={{ hideFace: avatar.privacyFaceHidden, hideBackground: avatar.privacyBackgroundHidden, hideFeatures: false }}
        remotePhotoPath={avatar.photoProcessedUrl ?? avatar.photoOriginalUrl}
        showToggles={false}
        onPrivacyChange={() => undefined}
      />
    </section>
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
  const originalPath = avatar.photoOriginalUrl;
  const enhancedPath = avatar.photoEnhancedUrl;
  if (!originalPath || !enhancedPath) return null;

  return (
    <section className="rounded-[28px] border border-[#f0dce8] bg-[#fff8fd] p-4">
      <h3 className="text-base font-semibold text-[#302637]">Сравните варианты</h3>
      <p className="mt-1 text-sm leading-5 text-[#6d6273]">Улучшаем фон, чёткость и одежду для точной примерки. Лицо, фигура, пропорции и поза должны сохраниться.</p>
      <TryOnBeforeAfter afterSrc={enhancedPath} beforeSrc={originalPath} className="mt-3 max-w-[560px]" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} type="button" onClick={onApply}>Сохранить этот вариант</Button>
        <Button disabled={busy} type="button" variant="secondary" onClick={onRevert}>Вернуть первоначальный</Button>
      </div>
    </section>
  );
}

function AvatarCandidatePanel({
  avatar,
  accessToken,
  busy,
  onEnhance,
  onSaveOriginal,
  processing,
}: {
  avatar: AvatarRecord;
  accessToken?: string | null;
  busy: boolean;
  onEnhance: () => void;
  onSaveOriginal: () => void;
  processing: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-[#f0dce8] bg-gradient-to-br from-white to-[#fff8fd] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="soft">Можно улучшить</Pill>
        <p className="text-sm leading-5 text-[#6d6273]">
          Фото подходит для примерки. Можно сохранить как есть или сначала улучшить фон и чёткость.
        </p>
      </div>
      <AvatarPrivacyPreview
        accessToken={accessToken}
        privacy={{ hideFace: avatar.privacyFaceHidden, hideBackground: avatar.privacyBackgroundHidden, hideFeatures: false }}
        remotePhotoPath={avatar.photoOriginalUrl ?? avatar.photoProcessedUrl}
        showToggles={false}
        processing={processing}
        processingLabel="Улучшаем аватар…"
        onPrivacyChange={() => undefined}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} type="button" onClick={onEnhance}>
          Улучшить аватар
        </Button>
        <Button disabled={busy} type="button" variant="secondary" onClick={onSaveOriginal}>
          Сохранить этот вариант
        </Button>
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
  const [busyAction, setBusyAction] = useState<"validate" | "enhance" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [hideFace, setHideFace] = useState(false);
  const [hideBackground, setHideBackground] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [adding, setAdding] = useState(false);
  const [avatarGuidance, setAvatarGuidance] = useState<{ title?: string; message?: string } | null>(null);
  const [enhancementAvatar, setEnhancementAvatar] = useState<AvatarRecord | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<AvatarRecord | null>(null);
  const [featuredAvatarId, setFeaturedAvatarId] = useState<string | null>(activeAvatarId ?? null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const autoAddPhotoRef = useRef<File | null>(null);

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
    if (activeAvatarId) {
      setFeaturedAvatarId(activeAvatarId);
    }
  }, [activeAvatarId]);

  useEffect(() => {
    if (!newPhoto) {
      setNewPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newPhoto);
    setNewPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newPhoto]);

  useEffect(() => {
    if (!newPhoto || busy || autoAddPhotoRef.current === newPhoto) {
      return;
    }
    autoAddPhotoRef.current = newPhoto;
    void addAvatar(newPhoto);
  }, [newPhoto, busy]);

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
    setBusyAction("enhance");
    setError(null);
    try {
      const { avatar } = await api.enhanceAvatar(avatarId);
      setEnhancementAvatar(avatar);
      setPendingAvatar((current) => (current?.id === avatar.id ? avatar : current));
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось улучшить фото");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function applyEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setBusyAction("save");
    setError(null);
    try {
      await api.applyAvatarEnhancement(enhancementAvatar.id);
      await activateReadyAvatarOrShowAnthropometry(enhancementAvatar.id, "Улучшенное фото сохранено");
      setFeaturedAvatarId(enhancementAvatar.id);
      setEnhancementAvatar(null);
      setPendingAvatar(null);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось применить улучшенный вариант");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function revertEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setBusyAction("save");
    setError(null);
    try {
      await api.revertAvatarEnhancement(enhancementAvatar.id);
      await activateReadyAvatarOrShowAnthropometry(enhancementAvatar.id, "Аватар сохранён");
      setFeaturedAvatarId(enhancementAvatar.id);
      setEnhancementAvatar(null);
      setPendingAvatar(null);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось вернуть исходный вариант");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function addAvatar(photo: File | null = newPhoto) {
    if (!photo) {
      setError("Выберите фото для нового аватара");
      return;
    }
    setBusy(true);
    setBusyAction("validate");
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
      await api.uploadAvatarPhoto(avatar.id, photo);
      const validation = await api.validateAvatar(avatar.id);
      if (validation.recommendedAction === "replace_photo" || validation.avatar.status === "VALIDATION_FAILED") {
        setAvatarGuidance({ title: validation.guidanceTitle, message: validation.guidanceMessage });
        setNewPhoto(null);
        return;
      }
      if (validation.recommendedAction === "continue_with_warning" || validation.warnings.length > 0) {
        setPendingAvatar(validation.avatar);
        setAdding(false);
        setNewPhoto(null);
        return;
      }
      await api.preprocessAvatar(avatar.id);
      reachedReadyState = true;
      avatarActivated = await activateReadyAvatarOrShowAnthropometry(avatar.id, "Аватар сохранён");
      setFeaturedAvatarId(avatar.id);
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
      if (autoAddPhotoRef.current === photo) {
        autoAddPhotoRef.current = null;
      }
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function saveOriginalAvatar(avatarId: string) {
    setBusy(true);
    setBusyAction("save");
    setError(null);
    setAvatarGuidance(null);
    try {
      await api.preprocessAvatar(avatarId);
      await activateReadyAvatarOrShowAnthropometry(avatarId, "Аватар сохранён");
      setFeaturedAvatarId(avatarId);
      setPendingAvatar(null);
      setEnhancementAvatar(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить аватар");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function activateReadyAvatarOrShowAnthropometry(avatarId: string, title: string) {
    try {
      await api.activateAvatar(avatarId);
      return true;
    } catch (err) {
      if (!(err instanceof ApiError) || err.code !== "ANTHROPOMETRY_REQUIRED") {
        throw err;
      }
      setAvatarGuidance({
        title,
        message: "Чтобы сделать его основным, укажите рост, грудь, талию и бёдра.",
      });
      return false;
    }
  }

  const readyAvatarCount = avatars.filter((avatar) => avatar.status === "READY").length;
  const atAvatarLimit = readyAvatarCount >= MAX_AVATARS_PER_USER;
  const needsFirstAvatar = !activeAvatarId && readyAvatarCount === 0;
  const visibleAvatars = avatars.filter((avatar) => avatar.status === "READY");
  const featuredAvatar =
    visibleAvatars.find((avatar) => avatar.active) ??
    visibleAvatars.find((avatar) => avatar.id === featuredAvatarId) ??
    (visibleAvatars.length === 1 ? visibleAvatars[0] : null);
  const reserveAvatars = featuredAvatar
    ? visibleAvatars.filter((avatar) => avatar.id !== featuredAvatar.id)
    : visibleAvatars;

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

      {(adding || needsFirstAvatar) && !pendingAvatar && !enhancementAvatar ? (
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
              processing={busyAction === "validate"}
              onSelectPhoto={() => photoInputRef.current?.click()}
              onPrivacyChange={(next) => {
                if (next.hideFace !== undefined) setHideFace(next.hideFace);
                if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
              }}
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

      {!enhancementAvatar && pendingAvatar ? (
        <AvatarCandidatePanel
          accessToken={accessToken}
          avatar={pendingAvatar}
          busy={busy}
          processing={busyAction === "enhance"}
          onEnhance={() => void enhanceAvatar(pendingAvatar.id)}
          onSaveOriginal={() => void saveOriginalAvatar(pendingAvatar.id)}
        />
      ) : null}

      {!pendingAvatar && !enhancementAvatar && featuredAvatar ? (
        <FeaturedAvatarPanel accessToken={accessToken} avatar={featuredAvatar} />
      ) : null}

      {!loading && visibleAvatars.length === 0 && !pendingAvatar && !enhancementAvatar ? (
        <p className={mutedTextClassName}>Аватары пока не готовы.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reserveAvatars.map((avatar) => (
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
