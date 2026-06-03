"""Generate VibeStyle logo assets (vibestyle.art) — circular mark, V + diagonal Style."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
WEB_APP = ROOT.parent / "web-app" / "app"
WEB_PUBLIC = ROOT.parent / "web-app" / "public"
LANDING_APP = ROOT.parent / "landing" / "app"
LANDING_PUBLIC = ROOT.parent / "landing" / "public"
ADMIN_APP = ROOT.parent / "admin" / "app"
SIZE = 1024

FONT_CANDIDATES = {
    "serif": [
        Path(r"C:\Windows\Fonts\timesbd.ttf"),
        Path(r"C:\Windows\Fonts\Georgia.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"),
    ],
    "script": [
        Path(r"C:\Windows\Fonts\BRUSHSCI.TTF"),
        Path(r"C:\Windows\Fonts\segoesc.ttf"),
        Path(r"C:\Windows\Fonts\ITCBLKAD.TTF"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"),
    ],
}

SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="vibe-bg" x1="32" x2="32" y1="5" y2="59" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffb8de"/>
      <stop offset="1" stop-color="#ff1fa2"/>
    </linearGradient>
    <clipPath id="vibe-circle">
      <circle cx="32" cy="32" r="30"/>
    </clipPath>
    <filter id="vibe-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#8a0050" flood-opacity="0.32"/>
    </filter>
  </defs>
  <g clip-path="url(#vibe-circle)">
    <circle cx="32" cy="32" r="30" fill="url(#vibe-bg)"/>
    <path d="M20 12 L32 42 L44 12" stroke="#fff" stroke-width="7.2" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="rotate(-13 20.5 36.8)">
      <text fill="#c01278" font-family="'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive" font-size="18.5" text-anchor="start" x="10.5" y="38.8">Style</text>
    </g>
  </g>
  <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.42)" stroke-width="0.75" fill="none"/>
</svg>
"""


def load_font(candidates: list[Path], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def make_circle_gradient(size: int, inset: int = 0) -> Image.Image:
    top = (255, 184, 222)
    bottom = (255, 31, 162)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    cx = cy = size / 2
    radius = size / 2 - inset
    for y in range(size):
        t = y / (size - 1)
        color = (lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t))
        for x in range(size):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius**2:
                px[x, y] = (*color, 255)
    return img


def apply_circle_mask(img: Image.Image, inset: int = 0) -> Image.Image:
    rgba = img.convert("RGBA")
    size = rgba.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    margin = inset
    draw.ellipse((margin, margin, size - margin - 1, size - margin - 1), fill=255)
    rgba.putalpha(mask)
    return rgba


def draw_v_letter(draw: ImageDraw.ImageDraw, font: ImageFont.ImageFont, size: int) -> tuple[float, float, float, float]:
    """Draw a clear V mark, not a font glyph that can read as W at icon size."""
    del font
    x1 = size * 0.18
    x2 = size * 0.5
    x3 = size * 0.82
    y_top = size * 0.08
    y_bottom = size * 0.82
    width = int(size * 0.095)
    draw.line((x1, y_top, x2, y_bottom, x3, y_top), fill=(255, 255, 255, 255), width=width, joint="curve")
    return x1, y_top, x3 - x1, y_bottom - y_top


def draw_rotated_style(
    base: Image.Image,
    font: ImageFont.ImageFont,
    v_x: float,
    v_y: float,
    v_w: float,
    v_h: float,
    angle: float = 13,
) -> Image.Image:
    """angle > 0 in PIL = CCW = Style rises up to the right."""
    text = "Style"
    rgba = base.convert("RGBA")
    layer = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    ox = int(v_x + v_w * 0.18)
    oy = int(v_y + v_h * 0.30)
    layer_draw.text((ox, oy), text, font=font, fill=(192, 18, 120, 255))
    bbox = layer_draw.textbbox((ox, oy), text, font=font)
    pivot = (ox + (bbox[2] - bbox[0]) * 0.12, oy + (bbox[3] - bbox[1]) * 0.28)
    rotated = layer.rotate(angle, center=pivot, resample=Image.Resampling.BICUBIC)
    return Image.alpha_composite(rgba, rotated)


def draw_ring(img: Image.Image, width: int = 3) -> Image.Image:
    rgba = img.convert("RGBA")
    draw = ImageDraw.Draw(rgba)
    size = rgba.size[0]
    margin = width
    draw.ellipse(
        (margin, margin, size - margin - 1, size - margin - 1),
        outline=(255, 255, 255, 90),
        width=width,
    )
    return rgba


def generate_logo() -> Image.Image:
    img = make_circle_gradient(SIZE, inset=8)
    draw = ImageDraw.Draw(img)

    serif = load_font(FONT_CANDIDATES["serif"], 540)
    script = load_font(FONT_CANDIDATES["script"], 248)

    v_x, v_y, v_w, v_h = draw_v_letter(draw, serif, SIZE)
    img = draw_rotated_style(img, script, v_x, v_y, v_w, v_h, angle=13)
    img = apply_circle_mask(img, inset=0)
    return img


def write_web_icons(logo: Image.Image) -> None:
    rgb_logo = logo.convert("RGB")
    for app_dir in (WEB_APP, LANDING_APP, ADMIN_APP):
        app_dir.mkdir(parents=True, exist_ok=True)
        (app_dir / "icon.svg").write_text(SVG_TEMPLATE, encoding="utf-8")
        rgb_logo.save(app_dir / "icon.png", format="PNG")
        logo.resize((180, 180), Image.Resampling.LANCZOS).convert("RGB").save(
            app_dir / "apple-icon.png", format="PNG"
        )
        print(f"Wrote web icons to {app_dir}")

    for public_dir in (WEB_PUBLIC, LANDING_PUBLIC):
        public_dir.mkdir(parents=True, exist_ok=True)
        (public_dir / "brand-mark.svg").write_text(SVG_TEMPLATE, encoding="utf-8")
        logo.resize((512, 512), Image.Resampling.LANCZOS).save(public_dir / "brand-mark.png", format="PNG")
        print(f"Wrote public brand assets to {public_dir}")


ANDROID_ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ANDROID_FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

ANDROID_SPLASH_SIZES = {
    "drawable-mdpi": 200,
    "drawable-hdpi": 300,
    "drawable-xhdpi": 400,
    "drawable-xxhdpi": 600,
    "drawable-xxxhdpi": 800,
}


def write_android_icons(logo: Image.Image) -> None:
    for density, px in ANDROID_ICON_SIZES.items():
        out_dir = ANDROID_RES / density
        out_dir.mkdir(parents=True, exist_ok=True)
        icon = logo.resize((px, px), Image.Resampling.LANCZOS)
        icon.save(out_dir / "ic_launcher.webp", format="WEBP", quality=95)
        icon.save(out_dir / "ic_launcher_round.webp", format="WEBP", quality=95)
        print(f"Wrote launcher icons to {out_dir}")

    for density, px in ANDROID_FOREGROUND_SIZES.items():
        out_dir = ANDROID_RES / density
        out_dir.mkdir(parents=True, exist_ok=True)
        foreground = logo.resize((px, px), Image.Resampling.LANCZOS)
        foreground.save(out_dir / "ic_launcher_foreground.webp", format="WEBP", quality=95)
        print(f"Wrote adaptive foreground to {out_dir}")

    for density, px in ANDROID_SPLASH_SIZES.items():
        out_dir = ANDROID_RES / density
        out_dir.mkdir(parents=True, exist_ok=True)
        splash = logo.resize((px, px), Image.Resampling.LANCZOS)
        splash.save(out_dir / "splashscreen_logo.png", format="PNG")
        print(f"Wrote splash logo to {out_dir}")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    logo = generate_logo()
    logo_rgb = logo.convert("RGB")
    for name in ("icon.png", "splash-icon.png", "adaptive-icon.png"):
        out = ASSETS / name
        logo_rgb.save(out, format="PNG")
        print(f"Wrote {out}")
    write_android_icons(logo)
    write_web_icons(logo)


if __name__ == "__main__":
    main()
