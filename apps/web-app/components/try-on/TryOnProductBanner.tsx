"use client";

import type { ProductPreview } from "@wibestyle/shared-types";
import TryOnBannerProductThumb from "@/components/try-on/TryOnBannerProductThumb";
import {
  formatProductPriceRub,
  marketplaceLabel,
  productBannerHref,
} from "@/lib/try-on-product";

type Props = {
  product: ProductPreview;
  selectedSize?: string;
};

export default function TryOnProductBanner({ product, selectedSize }: Props) {
  const href = productBannerHref(product);
  const price = formatProductPriceRub(product.priceRub);
  const sizeLabel = selectedSize ?? product.sizes?.[0];

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {product.imageUrl ? (
          <TryOnBannerProductThumb
            alt={product.title}
            className="size-14 sm:size-16"
            imageUrl={product.imageUrl}
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-[#ffd1ed] bg-[#fff8fd] text-lg sm:size-16">
            👗
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#ff1fa2]">
            {marketplaceLabel(product.marketplace)}
            {product.brand ? ` · ${product.brand}` : ""}
          </p>
          <p className="truncate text-base font-medium text-[#302637] sm:text-lg">{product.title}</p>
          <p className="mt-0.5 text-sm text-[#6d6273]">
            {sizeLabel ? `Размер ${sizeLabel}` : "Размер не указан"}
            {price ? ` · ${price}` : ""}
          </p>
        </div>
      </div>
      {href ? (
        <span className="hidden shrink-0 text-sm font-medium text-[#ff1fa2] sm:inline">
          В корзину →
        </span>
      ) : null}
    </>
  );

  const className =
    "flex w-full items-center justify-between gap-3 rounded-2xl border border-[#ffd1ed] bg-gradient-to-r from-white to-[#fff8fd] px-3 py-2.5 shadow-[0_8px_24px_rgba(58,12,82,0.05)] transition sm:px-4 sm:py-3";

  if (href) {
    return (
      <a
        className={`${className} hover:border-[#ff1fa2] hover:shadow-[0_10px_28px_rgba(255,31,162,0.12)]`}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
