import clsx from "clsx";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Cat-eye sunglasses — fashion accessory mark for WibeStyle. */
export function BrandMark({ className, title = "Я на стиле" }: BrandMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={clsx("shrink-0", className)}
      fill="none"
      role={title ? "img" : "presentation"}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <rect fill="#fff4fb" height="32" rx="9" width="32" />
      <path
        d="M5.5 17.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5-6.5-2.9-6.5-6.5Z"
        stroke="#ff1fa2"
        strokeWidth="1.6"
      />
      <path
        d="M13.5 17.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5-6.5-2.9-6.5-6.5Z"
        stroke="#ff1fa2"
        strokeWidth="1.6"
      />
      <path d="M11.8 17.5h8.4" stroke="#ff1fa2" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M3.5 16.8h2.2M26.3 16.8h2.2" stroke="#ff1fa2" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}
