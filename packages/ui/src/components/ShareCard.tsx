"use client";

import type { ReactNode } from "react";

import clsx from "clsx";

import QRCode from "react-qr-code";

type ShareCardProps = {
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: "image" | "video";
  /** When set, overrides plain `imageUrl` (e.g. authenticated blob preview). */
  imageElement?: ReactNode;
  /** When set, overrides plain `videoUrl` (e.g. authenticated blob preview). */
  videoElement?: ReactNode;
  postSlug: string;
  showProductLink?: boolean;
  productTitle?: string;
  eliteFrame?: boolean;
  appBaseUrl?: string;
  /** Landing URL encoded in the QR code (app access). */
  landingUrl?: string;
  /** Brand domain shown in the footer watermark. */
  brandDomain?: string;
};

export function ShareCard({
  imageUrl,
  videoUrl,
  mediaType = "image",
  imageElement,
  videoElement,
  postSlug,
  showProductLink = false,
  productTitle,
  eliteFrame = false,
  appBaseUrl = "https://app.vibestyle.art",
  landingUrl = "https://vibestyle.art",
  brandDomain = "vibestyle.art",
}: ShareCardProps) {
  const postUrl = `${appBaseUrl.replace(/\/$/, "")}/p/${postSlug}`;
  const qrUrl = landingUrl.replace(/\/$/, "");
  const isVideo = mediaType === "video";

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-[28px] border bg-white shadow-[0_20px_60px_rgba(58,12,82,0.14),0_8px_24px_rgba(255,31,162,0.08)]",
        eliteFrame ? "border-[#ffb347]" : "border-[#ffd1ed]",
      )}
    >
      <div className="relative">
        {isVideo
          ? videoElement ?? (
              videoUrl ? (
                <video
                  autoPlay
                  className="aspect-[4/5] w-full object-cover"
                  controls
                  loop
                  muted
                  playsInline
                  src={videoUrl}
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-[#faf5f9]" />
              )
            )
          : imageElement ?? (
              imageUrl ? (
                <img src={imageUrl} alt="Share card" className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="aspect-[4/5] w-full bg-[#faf5f9]" />
              )
            )}

        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-[#ff1fa2]">
          Я на стиле
        </div>

        {eliteFrame ? (
          <div className="pointer-events-none absolute inset-3 rounded-[22px] border-2 border-[#ffb347]/80" />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-6 border-t border-[#ffd1ed]/60 bg-white px-6 py-5 sm:px-7">
        <div className="min-w-0 flex-1 pl-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-[#ff1fa2]">{brandDomain}</p>
          <p className="mt-1 font-normal text-[#302637]">
            {showProductLink && productTitle ? productTitle : "Образ без ссылки на магазин"}
          </p>
          <p className="mt-1 truncate text-sm font-normal text-[#6d6273]">{postUrl.replace(/^https?:\/\//, "")}</p>
        </div>
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#ffd1ed] bg-white p-2"
          aria-label={`QR-код: ${qrUrl}`}
        >
          <QRCode value={qrUrl} size={64} level="M" />
        </div>
      </div>
    </div>
  );
}
