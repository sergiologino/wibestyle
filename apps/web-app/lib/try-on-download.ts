"use client";

import qrcode from "qrcode-generator";
import { brandDomain, isProtectedApiMediaUrl, landingSiteUrl, resolveApiPath } from "@/lib/api-media";

type DownloadTryOnImageOptions = {
  imageUrl: string;
  accessToken: string | null;
  getAccessTokenForMedia: () => Promise<string | null>;
  filename?: string;
};

async function fetchImageBlob(
  imageUrl: string,
  accessToken: string | null,
  getAccessTokenForMedia: () => Promise<string | null>,
) {
  const resolved = resolveApiPath(imageUrl) ?? imageUrl;
  const protectedMedia = isProtectedApiMediaUrl(imageUrl);

  async function fetchOnce(token: string | null) {
    return fetch(resolved, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  }

  let token = protectedMedia ? accessToken : null;
  if (protectedMedia && !token) {
    token = await getAccessTokenForMedia();
  }

  let response = await fetchOnce(token);
  if (response.status === 401 && protectedMedia) {
    token = await getAccessTokenForMedia();
    response = await fetchOnce(token);
  }
  if (!response.ok) {
    throw new Error("Failed to load try-on image");
  }
  return response.blob();
}

async function loadImageFromBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

async function loadBrandMark() {
  try {
    const response = await fetch("/brand-mark.png");
    if (!response.ok) return null;
    return loadImageFromBlob(await response.blob());
  } catch {
    return null;
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawQr(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();

  const modules = qr.getModuleCount();
  const quiet = 4;
  const cell = size / (modules + quiet * 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#17121c";

  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          x + (col + quiet) * cell,
          y + (row + quiet) * cell,
          Math.ceil(cell),
          Math.ceil(cell),
        );
      }
    }
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function downloadWatermarkedTryOnImage({
  imageUrl,
  accessToken,
  getAccessTokenForMedia,
  filename = "vibestyle-try-on.png",
}: DownloadTryOnImageOptions) {
  const imageBlob = await fetchImageBlob(imageUrl, accessToken, getAccessTokenForMedia);
  const [image, logo] = await Promise.all([loadImageFromBlob(imageBlob), loadBrandMark()]);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const margin = Math.max(18, Math.round(canvas.width * 0.028));
  const qrSize = Math.max(88, Math.min(150, Math.round(canvas.width * 0.16)));
  const logoSize = Math.max(30, Math.min(54, Math.round(canvas.width * 0.06)));
  const fontSize = Math.max(18, Math.min(32, Math.round(canvas.width * 0.03)));
  const label = brandDomain();
  const landingUrl = landingSiteUrl();

  ctx.save();
  ctx.font = `600 ${fontSize}px Manrope, Arial, sans-serif`;
  const labelWidth = ctx.measureText(label).width;
  const badgeHeight = Math.round(logoSize + margin * 0.7);
  const badgeWidth = Math.round(logoSize + labelWidth + margin * 1.4);
  const badgeX = margin;
  const badgeY = canvas.height - margin - badgeHeight;

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, Math.round(badgeHeight / 2));
  ctx.fill();
  ctx.globalAlpha = 1;

  if (logo) {
    ctx.drawImage(logo, badgeX + margin * 0.35, badgeY + (badgeHeight - logoSize) / 2, logoSize, logoSize);
  } else {
    ctx.fillStyle = "#ff1fa2";
    ctx.beginPath();
    ctx.arc(badgeX + margin * 0.35 + logoSize / 2, badgeY + badgeHeight / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(logoSize * 0.52)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("V", badgeX + margin * 0.35 + logoSize / 2, badgeY + badgeHeight / 2 + 1);
  }

  ctx.fillStyle = "#302637";
  ctx.font = `600 ${fontSize}px Manrope, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, badgeX + margin * 0.7 + logoSize, badgeY + badgeHeight / 2);

  const qrX = canvas.width - margin - qrSize;
  const qrY = canvas.height - margin - qrSize;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawQr(ctx, landingUrl, qrX, qrY, qrSize);
  ctx.restore();

  const output = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export try-on image"));
    }, "image/png");
  });

  triggerDownload(output, filename);
}

export async function downloadProtectedFile(options: DownloadTryOnImageOptions) {
  const blob = await fetchImageBlob(options.imageUrl, options.accessToken, options.getAccessTokenForMedia);
  triggerDownload(blob, options.filename ?? "vibestyle-export");
}
