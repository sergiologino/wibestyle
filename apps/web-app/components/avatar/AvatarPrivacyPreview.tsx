"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { fetchAuthenticatedBlobUrl, resolveApiPath } from "@/lib/api-media";
import { FieldCheckbox } from "@/components/ui/fields";

const DEFAULT_AVATAR_SAMPLE_SRC = "/assets/avatar/default-avatar-sample.webp";

type PrivacyState = {
  hideFace: boolean;
  hideBackground: boolean;
  hideFeatures: boolean;
};

type AvatarPrivacyPreviewProps = {
  /** Local blob URL from file upload */
  localPreviewUrl?: string | null;
  /** Server avatar photo path */
  remotePhotoPath?: string | null;
  accessToken?: string | null;
  privacy: PrivacyState;
  onPrivacyChange: (next: Partial<PrivacyState>) => void;
  showToggles?: boolean;
  processing?: boolean;
  /** Lets the visual avatar area open the same file picker as the explicit control. */
  onSelectPhoto?: () => void;
  /** Rendered immediately below the image, before privacy controls on narrow screens. */
  primaryAction?: ReactNode;
};

export function avatarPrivacyPreviewClassName(privacy: PrivacyState) {
  const classes = ["relative overflow-hidden rounded-[28px] bg-[#f8f0f6]"];
  if (privacy.hideBackground) classes.push("avatar-preview--hide-bg");
  if (privacy.hideFeatures) classes.push("avatar-preview--hide-features");
  return classes.join(" ");
}

export default function AvatarPrivacyPreview({
  localPreviewUrl,
  remotePhotoPath,
  accessToken,
  privacy,
  onPrivacyChange,
  showToggles = true,
  processing = false,
  onSelectPhoto,
  primaryAction,
}: AvatarPrivacyPreviewProps) {
  const [remoteBlobUrl, setRemoteBlobUrl] = useState<string | null>(null);

  const displayUrl = localPreviewUrl ?? remoteBlobUrl;

  useEffect(() => {
    if (localPreviewUrl || !remotePhotoPath || !accessToken) {
      setRemoteBlobUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const fullUrl = resolveApiPath(remotePhotoPath);
    if (!fullUrl) return;

    void fetchAuthenticatedBlobUrl(fullUrl, accessToken).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setRemoteBlobUrl(url);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, localPreviewUrl, remotePhotoPath]);

  const wrapperClass = useMemo(() => avatarPrivacyPreviewClassName(privacy), [privacy]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
      <div className="grid gap-3">
        <button
          aria-label="Выбрать фото для аватара"
          className={`${wrapperClass} min-h-[320px] text-left shadow-[0_24px_60px_rgba(255,31,162,0.12)] ${onSelectPhoto ? "cursor-pointer transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff1fa2]" : "cursor-default"}`}
          disabled={!onSelectPhoto || processing}
          type="button"
          onClick={onSelectPhoto}
        >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Превью avatar"
              className="avatar-preview-image mx-auto block max-h-[520px] w-full object-contain"
              src={displayUrl}
            />
            {privacy.hideFace ? <div aria-hidden className="avatar-preview-face-mask" /> : null}
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Образец фото для аватара"
              className="avatar-preview-image mx-auto block max-h-[520px] min-h-[320px] w-full object-contain"
              src={DEFAULT_AVATAR_SAMPLE_SRC}
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-[28deg] text-4xl font-black tracking-[0.22em] text-[#6d6273]/55 sm:text-6xl">ОБРАЗЕЦ</span>
          </>
        )}
        {processing ? (
          <div aria-live="polite" className="absolute inset-0 z-10 flex items-center justify-center bg-[#302637]/45 p-5">
            <div className="flex max-w-xs items-center gap-3 rounded-2xl border border-white/35 bg-white/95 px-4 py-3 text-sm font-medium text-[#302637] shadow-xl">
              <span aria-hidden className="size-5 shrink-0 animate-spin rounded-full border-2 border-[#ff1fa2]/25 border-t-[#ff1fa2]" />
              <span>Идёт проверка корректности фото для аватара…</span>
            </div>
          </div>
        ) : null}
        </button>
        {primaryAction ? <div>{primaryAction}</div> : null}
      </div>

      {showToggles ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-[#302637]">Приватность</p>
          <p className="text-xs font-normal text-[#6d6273]">Включайте и сразу смотрите результат. Повторное нажатие вернёт исходный вид.</p>
          <FieldCheckbox
            checked={privacy.hideFace}
            description="Размываем область лица"
            label="Скрыть лицо"
            onChange={(checked) => onPrivacyChange({ hideFace: checked })}
          />
          <FieldCheckbox
            checked={privacy.hideBackground}
            description="Убираем отвлекающий фон"
            label="Скрыть фон"
            onChange={(checked) => onPrivacyChange({ hideBackground: checked })}
          />
          <FieldCheckbox
            checked={false}
            description="Скоро — пока недоступно в MVP"
            disabled
            label="Скрыть отличительные черты"
          />
        </div>
      ) : null}
    </div>
  );
}
