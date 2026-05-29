"use client";



import type { ReactNode } from "react";

import clsx from "clsx";

import QRCode from "react-qr-code";



type ShareCardProps = {

  imageUrl?: string;

  /** When set, overrides plain `imageUrl` (e.g. authenticated blob preview). */
  imageElement?: ReactNode;

  postSlug: string;

  showProductLink?: boolean;

  productTitle?: string;

  eliteFrame?: boolean;

  appBaseUrl?: string;

};



export function ShareCard({

  imageUrl,

  imageElement,

  postSlug,

  showProductLink = false,

  productTitle,

  eliteFrame = false,

  appBaseUrl = "https://app.wibestyle.ru",

}: ShareCardProps) {

  const postUrl = `${appBaseUrl.replace(/\/$/, "")}/p/${postSlug}`;



  return (

    <div

      className={clsx(

        "overflow-hidden rounded-[28px] border bg-white shadow-[0_20px_60px_rgba(58,12,82,0.14),0_8px_24px_rgba(255,31,162,0.08)]",

        eliteFrame ? "border-[#ffb347]" : "border-[#ffd1ed]",

      )}

    >

      <div className="relative">

        {imageElement ?? (
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

          <div className="absolute inset-2 rounded-[22px] border-2 border-[#ffb347]/80" />

        ) : null}

      </div>

      <div className="flex items-center justify-between gap-4 p-5">

        <div>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#ff1fa2]">Fashion share</p>

          <p className="mt-1 font-normal text-[#302637]">

            {showProductLink && productTitle ? productTitle : "Образ без ссылки на магазин"}

          </p>

          <p className="mt-1 text-sm font-normal text-[#6d6273]">{postUrl.replace(/^https?:\/\//, "")}</p>

        </div>

        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#ffd1ed] bg-white p-2">

          <QRCode value={postUrl} size={64} level="M" />

        </div>

      </div>

    </div>

  );

}

