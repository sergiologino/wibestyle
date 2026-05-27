"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@wibestyle/ui";
import { resolveProductImageUrl } from "@/lib/product-image";

type ProductPreviewImageProps = {
  imageUrl: string;
  alt: string;
  className?: string;
};

export default function ProductPreviewImage({ imageUrl, alt, className }: ProductPreviewImageProps) {
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    const base = resolveProductImageUrl(imageUrl);
    if (!base || retry === 0) {
      return base;
    }
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}retry=${retry}&t=${Date.now()}`;
  }, [imageUrl, retry]);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

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
            setLoaded(true);
            setFailed(false);
          }}
          onError={() => {
            if (retry < 3) {
              setRetry((value) => value + 1);
              return;
            }
            setFailed(true);
            setLoaded(false);
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
