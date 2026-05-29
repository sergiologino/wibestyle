"use client";

import { useEffect, useState } from "react";
import type { AvatarRecord } from "@wibestyle/shared-types";
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
  busy,
}: {
  avatar: AvatarRecord;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const photoPath = avatar.photoProcessedUrl ?? avatar.photoOriginalUrl;
  const thumbUrl = useAuthenticatedBlob(photoPath);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
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
      <div className="grid gap-1 p-2">
        {active ? <Pill tone="soft">По умолчанию</Pill> : null}
        <div className="flex flex-wrap gap-1">
          {!active ? (
            <Button disabled={busy} size="md" type="button" variant="secondary" onClick={onSelect}>
              Сделать основным
            </Button>
          ) : null}
          {!active && avatar.status !== "DELETED" ? (
            <Button disabled={busy} size="md" type="button" variant="secondary" onClick={onDelete}>
              Удалить
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AvatarManager() {
  const { api, accessToken, refreshProfile } = useAppSession();
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [hideFace, setHideFace] = useState(true);
  const [hideBackground, setHideBackground] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [adding, setAdding] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const { items } = await api.listAvatars();
      setAvatars(items.filter((item) => item.status !== "DELETED"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить avatar");
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
      setError(err instanceof ApiError ? err.message : "Не удалось активировать avatar");
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
      setError(err instanceof ApiError ? err.message : "Не удалось удалить avatar");
    } finally {
      setBusy(false);
    }
  }

  async function addAvatar() {
    if (!newPhoto) {
      setError("Выберите фото для нового avatar");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { avatar } = await api.createAvatar({
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      });
      await api.uploadAvatarPhoto(avatar.id, newPhoto);
      await api.validateAvatar(avatar.id);
      await api.preprocessAvatar(avatar.id);
      await api.activateAvatar(avatar.id);
      setNewPhoto(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось добавить avatar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#302637]">Мои avatar</h2>
          <p className={mutedTextClassName}>Можно хранить несколько образов и выбрать основной для примерки.</p>
        </div>
        <Button size="md" type="button" variant="secondary" onClick={() => setAdding((value) => !value)}>
          {adding ? "Отмена" : "+ Новый avatar"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-[28px] border border-[#f0dce8] bg-gradient-to-br from-white to-[#fff8fd] p-4 shadow-sm">
          <FieldInput
            accept="image/*"
            className="cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[#ff1fa2]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#ff1fa2]"
            type="file"
            onChange={(event) => setNewPhoto(event.target.files?.[0] ?? null)}
          />
          <div className="mt-4">
            <AvatarPrivacyPreview
              localPreviewUrl={newPreviewUrl}
              privacy={{ hideFace, hideBackground, hideFeatures: false }}
              onPrivacyChange={(next) => {
                if (next.hideFace !== undefined) setHideFace(next.hideFace);
                if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
              }}
            />
          </div>
          <Button className="mt-4" disabled={busy || !newPhoto} size="lg" type="button" onClick={() => void addAvatar()}>
            {busy ? "Загружаем…" : "Сохранить новый avatar"}
          </Button>
        </div>
      ) : null}

      {loading ? <p className={mutedTextClassName}>Загружаем avatar…</p> : null}

      {!loading && avatars.length === 0 ? (
        <p className={mutedTextClassName}>Пока нет сохранённых avatar. Добавьте первый образ.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {avatars.map((avatar) => (
            <AvatarThumb
              key={avatar.id}
              active={avatar.active}
              avatar={avatar}
              busy={busy}
              onDelete={() => void deleteAvatar(avatar.id)}
              onSelect={() => void activateAvatar(avatar.id)}
            />
          ))}
        </div>
      )}

      {error ? <p className="text-sm font-normal text-[#c01278]">{error}</p> : null}
    </div>
  );
}
