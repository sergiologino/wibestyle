"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAuthenticatedBlobUrl, resolveApiPath } from "@/lib/api-media";
import { FieldCheckbox } from "@/components/ui/fields";

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
      <div className={`${wrapperClass} min-h-[320px] shadow-[0_24px_60px_rgba(255,31,162,0.12)]`}>
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
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff1fa2]/20 to-[#782cff]/20 text-2xl">
              ✨
            </div>
            <p className="text-sm font-normal text-[#6d6273]">Загрузите фото в полный рост — превью появится здесь</p>
          </div>
        )}
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
            checked={privacy.hideFeatures}
            description="Смягчаем отличительные детали"
            label="Скрыть отличительные черты"
            onChange={(checked) => onPrivacyChange({ hideFeatures: checked })}
          />
        </div>
      ) : null}
    </div>
  );
}
