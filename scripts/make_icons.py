#!/usr/bin/env python3
"""Draw the Mini Télé icon, maskable icon, favicon, and Android TV banner."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
ANDROID = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable"
FONT_BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
FONT_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"


def gradient(size, top, bottom):
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(size):
            pixels[x, y] = color
    return image


def star_points(cx, cy, outer, inner, n=5):
    import math

    points = []
    for i in range(n * 2):
        radius = outer if i % 2 == 0 else inner
        angle = -math.pi / 2 + i * math.pi / n
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def draw_tv(draw, box, scale):
    left, top, right, bottom = box
    radius = int(scale * 0.08)
    outline = int(max(4, scale * 0.018))
    draw.rounded_rectangle(box, radius=radius, fill="#FFF8F0", outline="#243047", width=outline)
    inset = int(scale * 0.055)
    screen = (left + inset, top + inset, right - inset, bottom - int(scale * 0.09))
    draw.rounded_rectangle(screen, radius=int(scale * 0.05), fill="#1B3A4B")
    cx = (screen[0] + screen[2]) / 2
    cy = (screen[1] + screen[3]) / 2 - scale * 0.01
    draw.polygon(star_points(cx, cy, scale * 0.11, scale * 0.045), fill="#FFE14A")
    foot_w = int(scale * 0.08)
    foot_h = int(scale * 0.035)
    gap = int(scale * 0.16)
    base_y = bottom - int(scale * 0.01)
    for dx in (-gap, gap):
        mid = (left + right) / 2 + dx
        draw.rounded_rectangle(
            (mid - foot_w / 2, base_y, mid + foot_w / 2, base_y + foot_h),
            radius=foot_h // 2,
            fill="#243047",
        )
    # Antenna
    stem_x = (left + right) / 2
    stem_top = top - int(scale * 0.11)
    draw.line((stem_x, top + radius * 0.2, stem_x - scale * 0.08, stem_top), fill="#243047", width=outline)
    draw.line((stem_x, top + radius * 0.2, stem_x + scale * 0.08, stem_top), fill="#243047", width=outline)
    ball = int(scale * 0.035)
    draw.ellipse((stem_x - scale * 0.08 - ball, stem_top - ball, stem_x - scale * 0.08 + ball, stem_top + ball), fill="#7DDFC3", outline="#243047", width=max(2, outline // 2))
    draw.ellipse((stem_x + scale * 0.08 - ball, stem_top - ball, stem_x + scale * 0.08 + ball, stem_top + ball), fill="#FF6B8A", outline="#243047", width=max(2, outline // 2))


def icon(size, maskable=False):
    image = gradient(size, (255, 139, 167), (126, 203, 255))
    draw = ImageDraw.Draw(image)
    margin = 0.22 if maskable else 0.12
    left = int(size * margin)
    right = int(size * (1 - margin))
    top = int(size * (margin + 0.06))
    bottom = int(size * (1 - margin + 0.02))
    draw_tv(draw, (left, top, right, bottom), size)
    return image


def banner():
    width, height = 320, 180
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    top = (255, 139, 167)
    bottom = (126, 203, 255)
    for y in range(height):
        t = y / (height - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(width):
            pixels[x, y] = color
    draw = ImageDraw.Draw(image)
    draw_tv(draw, (36, 34, 150, 148), 150)
    title_font = ImageFont.truetype(FONT_BOLD, 36)
    sub_font = ImageFont.truetype(FONT_MED, 18)
    draw.text((158, 58), "Mini Télé", font=title_font, fill="#243047")
    draw.text((160, 104), "dessins animés", font=sub_font, fill="#243047")
    return image


def main():
    ICONS.mkdir(parents=True, exist_ok=True)
    ANDROID.mkdir(parents=True, exist_ok=True)
    icon(192).save(ICONS / "icon-192.png")
    icon(512).save(ICONS / "icon-512.png")
    icon(512, maskable=True).save(ICONS / "icon-maskable-512.png")
    icon(180).save(ICONS / "apple-touch-180.png")
    icon(32).save(ICONS / "favicon-32.png")
    launcher = icon(192)
    launcher.save(ANDROID / "ic_launcher.png")
    banner().save(ANDROID / "tv_banner.png")
    print("icons written")


if __name__ == "__main__":
    main()
