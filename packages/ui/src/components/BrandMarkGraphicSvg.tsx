import clsx from "clsx";

type BrandMarkGraphicSvgProps = {
  className?: string;
  title?: string;
};

/**
 * Circular V + script Style rising up-right (S overlaps V).
 * Layout aligned with mobile app icon (generate-logo.py).
 */
export function BrandMarkGraphicSvg({ className, title }: BrandMarkGraphicSvgProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={clsx("shrink-0", className)}
      fill="none"
      role={title ? "img" : "presentation"}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="vibe-brand-bg" x1="32" x2="32" y1="5" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb8de" />
          <stop offset="1" stopColor="#ff1fa2" />
        </linearGradient>
        <clipPath id="vibe-brand-circle">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
        <filter id="vibe-brand-shadow" height="140%" width="140%" x="-20%" y="-20%">
          <feDropShadow dx="0" dy="1.2" floodColor="#8a0050" floodOpacity="0.32" stdDeviation="1.1" />
        </filter>
      </defs>
      <g clipPath="url(#vibe-brand-circle)">
        <circle cx="32" cy="32" fill="url(#vibe-brand-bg)" r="30" />
        <text
          fill="#fff"
          filter="url(#vibe-brand-shadow)"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="37"
          fontWeight="700"
          textAnchor="middle"
          x="32"
          y="29.5"
        >
          V
        </text>
        {/* Negative angle = Style rises up to the right; pivot near capital S */}
        <g transform="rotate(-13 20.5 39.5)">
          <text
            fill="#fff"
            filter="url(#vibe-brand-shadow)"
            fontFamily="'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive"
            fontSize="18.5"
            paintOrder="stroke fill"
            stroke="#d41484"
            strokeWidth="0.45"
            textAnchor="start"
            x="10.5"
            y="41.5"
          >
            Style
          </text>
        </g>
      </g>
      <circle cx="32" cy="32" fill="none" r="30" stroke="rgba(255,255,255,0.42)" strokeWidth="0.75" />
    </svg>
  );
}
