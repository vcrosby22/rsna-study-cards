#!/usr/bin/env python3
"""Generate navy/sand RSNA Cards PWA icons.

Outputs to ../public/:
  - icon-192.png
  - icon-512.png
  - icon-512-maskable.png  (full-bleed for Android adaptive icons)
  - apple-touch-icon-180.png
  - favicon.svg
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

NAVY = (20, 40, 80, 255)
SAND = (245, 233, 212, 255)
SOFT_SAND = (250, 243, 227, 255)
RUST = (184, 83, 28, 255)

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent / "public"
PUBLIC.mkdir(parents=True, exist_ok=True)


def find_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Avenir Next.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def rounded_rect_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask


def draw_icon(size: int, *, bleed: bool = False) -> Image.Image:
    """Draw the icon. If bleed=True, fill the entire square (for maskable)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if bleed:
        d.rectangle((0, 0, size, size), fill=NAVY)
    else:
        radius = int(size * 0.22)
        d.rounded_rectangle((0, 0, size, size), radius=radius, fill=NAVY)

    cx, cy = size / 2, size / 2

    # Stack of three "cards" rotated slightly, sand-colored
    card_w = size * 0.62
    card_h = size * 0.42
    radii = max(4, int(size * 0.04))

    layers = [
        {"dx": -size * 0.05, "dy": size * 0.07, "angle": -10, "alpha": 90},
        {"dx": size * 0.04, "dy": size * 0.03, "angle": 6, "alpha": 150},
        {"dx": 0, "dy": -size * 0.02, "angle": 0, "alpha": 255},
    ]

    for layer in layers:
        card_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card_layer)
        x0 = cx - card_w / 2 + layer["dx"]
        y0 = cy - card_h / 2 + layer["dy"]
        x1 = x0 + card_w
        y1 = y0 + card_h
        fill = (SAND[0], SAND[1], SAND[2], layer["alpha"])
        cd.rounded_rectangle((x0, y0, x1, y1), radius=radii, fill=fill)
        if layer["angle"] != 0:
            card_layer = card_layer.rotate(
                layer["angle"], resample=Image.BICUBIC, center=(cx, cy)
            )
        img.alpha_composite(card_layer)

    # "R" mark on the top card, rust color
    font = find_font(int(size * 0.34))
    text = "R"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1] - size * 0.02
    d.text((tx, ty), text, font=font, fill=RUST)

    # subtle accent dot for the "card stack" feel
    dot_r = max(2, int(size * 0.018))
    d.ellipse(
        (cx + size * 0.20 - dot_r, cy + size * 0.13 - dot_r,
         cx + size * 0.20 + dot_r, cy + size * 0.13 + dot_r),
        fill=RUST,
    )

    return img


def save(img: Image.Image, name: str) -> None:
    out = PUBLIC / name
    img.save(out, "PNG", optimize=True)
    print(f"wrote {out}")


def main() -> None:
    save(draw_icon(192), "icon-192.png")
    save(draw_icon(512), "icon-512.png")
    save(draw_icon(512, bleed=True), "icon-512-maskable.png")
    save(draw_icon(180), "apple-touch-icon-180.png")

    favicon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#142850"/>
  <g transform="translate(32 32)">
    <rect x="-22" y="-15" width="40" height="26" rx="3" fill="#f5e9d4" opacity="0.55" transform="rotate(-10)"/>
    <rect x="-19" y="-13" width="40" height="26" rx="3" fill="#f5e9d4" opacity="0.85" transform="rotate(6)"/>
    <rect x="-20" y="-14" width="40" height="26" rx="3" fill="#f5e9d4"/>
    <text x="0" y="6" text-anchor="middle" font-family="-apple-system, system-ui, Helvetica, Arial" font-weight="700" font-size="20" fill="#b8531c">R</text>
  </g>
</svg>
"""
    (PUBLIC / "favicon.svg").write_text(favicon_svg, encoding="utf-8")
    print(f"wrote {PUBLIC / 'favicon.svg'}")


if __name__ == "__main__":
    main()
