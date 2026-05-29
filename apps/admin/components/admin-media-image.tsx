"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/admin-api-base";

type AdminMediaImageProps = {
  adminKey: string;
  path?: string | null;
  alt: string;
  className?: string;
};

export function AdminMediaImage({ adminKey, path, alt, className }: AdminMediaImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path || !adminKey) {
      setBlobUrl(null);
      setFailed(false);
      return;
    }

    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setFailed(false);
      try {
        const response = await fetch(`${apiBaseUrl()}${path}`, {
          headers: { "X-Admin-Key": adminKey },
        });
        if (!response.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (revoked) URL.revokeObjectURL(revoked);
        revoked = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [adminKey, path]);

  if (!path) {
    return (
      <div className={`flex items-center justify-center bg-[#f8f4f7] text-xs font-bold text-[#6d6273] ${className ?? ""}`}>
        Нет фото
      </div>
    );
  }

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#f8f4f7] text-xs font-bold text-[#6d6273] ${className ?? ""}`}>
        Не загрузилось
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-[#f8f4f7] text-xs font-bold text-[#6d6273] ${className ?? ""}`}>
        Загрузка…
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
