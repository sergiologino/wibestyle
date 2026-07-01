"use client";

import { useMemo, useState } from "react";
import { Button } from "@wibestyle/ui";
import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import { isProtectedApiMediaUrl } from "@/lib/api-media";
import { resolveProductImageUrl } from "@/lib/product-image";

type ProductPreviewImageProps = {
  imageUrl: string;
  alt: string;
  className?: string;
};

export default function ProductPreviewImage({ imageUrl, alt, className }: ProductPreviewImageProps) {
  const [retry, setRetry] = useState(0);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const protectedMedia = isProtectedApiMediaUrl(imageUrl);
  const protectedBlob = useAuthenticatedBlob(protectedMedia ? imageUrl : null);

  const src = useMemo(() => {
    if (protectedMedia) {
      return protectedBlob;
    }
    const base = resolveProductImageUrl(imageUrl);
    if (!base || retry === 0) {
      return base;
    }
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}retry=${retry}&t=${Date.now()}`;
  }, [imageUrl, protectedBlob, protectedMedia, retry]);

  const failed = Boolean(src) && failedSrc === src;
  const loaded = Boolean(src) && loadedSrc === src;

  return (
    <div className="relative">
      {!loaded && !failed ? (
        <div className={`${className ?? ""} flex items-center justify-center bg-[#fff8fd] text-sm font-bold text-[#6d6273]`}>
          Загрузка фото…
        </div>
      ) : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`${className ?? ""} ${!loaded && !failed ? "absolute inset-0 opacity-0" : ""}`}
          referrerPolicy="no-referrer"
          onLoad={() => {
            setLoadedSrc(src);
            setFailedSrc(null);
          }}
          onError={() => {
            if (retry < 3) {
              setRetry((value) => value + 1);
              return;
            }
            setFailedSrc(src);
            setLoadedSrc(null);
          }}
        />
      ) : null}
      {failed ? (
        <div className={`${className ?? ""} flex flex-col items-center justify-center gap-3 bg-[#fff8fd] p-4 text-center`}>
          <p className="text-sm font-bold text-[#6d6273]">Не удалось загрузить фото товара</p>
          <Button type="button" variant="secondary" size="md" onClick={() => setRetry((value) => value + 1)}>
            Повторить
          </Button>
        </div>
      ) : null}
    </div>
  );
}
