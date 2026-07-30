#!/usr/bin/env python3
"""Resize Play Store assets and build promo video for Pazaryeri."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v2 as imageio
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(r"C:\Users\hasan\.cursor\projects\c-Users-hasan-OneDrive-Masa-st-pazaryeri\assets")
ICON_SRC = ROOT / "artifacts" / "mobile" / "assets" / "images" / "icon.png"
OUT = Path.home() / "OneDrive" / "Masaüstü" / "Pazaryeri-Play-Store"

FEATURE_SIZE = (1024, 500)
SCREENSHOT_SIZE = (1080, 1920)
ICON_SIZE = (512, 512)
VIDEO_SIZE = (1080, 1920)
FPS = 30


def ensure_dir() -> None:
    OUT.mkdir(parents=True, exist_ok=True)


def fit_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = img.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def save_jpg(img: Image.Image, path: Path, quality: int = 92) -> None:
    rgb = img.convert("RGB")
    rgb.save(path, "JPEG", quality=quality, optimize=True)


def save_png(img: Image.Image, path: Path) -> None:
    img.save(path, "PNG", optimize=True)


def process_static_assets() -> None:
    mapping = {
        "play-feature-graphic.png": ("01-feature-graphic-1024x500.jpg", FEATURE_SIZE, "jpg"),
        "play-screenshot-01-kesfet.png": ("02-ekran-kesfet-1080x1920.jpg", SCREENSHOT_SIZE, "jpg"),
        "play-screenshot-02-ilan-detay.png": ("03-ekran-ilan-detay-1080x1920.jpg", SCREENSHOT_SIZE, "jpg"),
        "play-screenshot-03-mesajlar.png": ("04-ekran-mesajlar-1080x1920.jpg", SCREENSHOT_SIZE, "jpg"),
        "play-screenshot-04-ilan-ver.png": ("05-ekran-ilan-ver-1080x1920.jpg", SCREENSHOT_SIZE, "jpg"),
    }

    for src_name, (out_name, size, fmt) in mapping.items():
        src = ASSETS / src_name
        if not src.exists():
            print(f"SKIP missing: {src}")
            continue
        img = Image.open(src)
        out_img = fit_cover(img, size)
        out_path = OUT / out_name
        if fmt == "jpg":
            save_jpg(out_img, out_path)
        else:
            save_png(out_img, out_path)
        print(f"OK {out_path.name} {out_img.size}")

    # Icon: prefer real app icon, fallback generated
    icon_src = ICON_SRC if ICON_SRC.exists() else ASSETS / "play-icon-512.png"
    icon = Image.open(icon_src)
    icon_out = fit_cover(icon, ICON_SIZE)
    save_png(icon_out, OUT / "00-uygulama-ikonu-512x512.png")
    print(f"OK 00-uygulama-ikonu-512x512.png {icon_out.size}")


def load_frame(name: str) -> Image.Image:
    path = ASSETS / name
    if not path.exists():
        raise FileNotFoundError(path)
    return fit_cover(Image.open(path), VIDEO_SIZE)


def add_ken_burns(base: Image.Image, zoom: float) -> Image.Image:
    w, h = base.size
    zw, zh = int(w * zoom), int(h * zoom)
    zoomed = base.resize((zw, zh), Image.Resampling.LANCZOS)
    left = (zw - w) // 2
    top = (zh - h) // 2
    return zoomed.crop((left, top, left + w, top + h))


def fade_blend(a: Image.Image, b: Image.Image, t: float) -> Image.Image:
    return Image.blend(a, b, max(0.0, min(1.0, t)))


def make_scene_frames(
    frame_img: Image.Image,
    duration_sec: float,
    *,
    zoom_from: float = 1.0,
    zoom_to: float = 1.08,
) -> list[Image.Image]:
    total = max(1, int(duration_sec * FPS))
    frames: list[Image.Image] = []
    for i in range(total):
        t = i / max(1, total - 1)
        zoom = zoom_from + (zoom_to - zoom_from) * t
        frames.append(add_ken_burns(frame_img, zoom))
    return frames


def crossfade(frames_a: list[Image.Image], frames_b: list[Image.Image], fade_frames: int) -> list[Image.Image]:
    if fade_frames <= 0:
        return frames_a + frames_b
    fade_frames = min(fade_frames, len(frames_a), len(frames_b))
    out = frames_a[:-fade_frames]
    for i in range(fade_frames):
        t = (i + 1) / fade_frames
        out.append(fade_blend(frames_a[-fade_frames + i], frames_b[i], t))
    out.extend(frames_b[fade_frames:])
    return out


def build_promo_video() -> Path:
    scenes = [
        ("play-promo-video-frame-hero.png", 3.0, 1.0, 1.1),
        ("play-screenshot-01-kesfet.png", 2.5, 1.05, 1.12),
        ("play-promo-video-frame-kategoriler.png", 2.5, 1.0, 1.08),
        ("play-screenshot-02-ilan-detay.png", 2.5, 1.05, 1.12),
        ("play-promo-video-frame-mesaj.png", 2.5, 1.0, 1.08),
        ("play-screenshot-03-mesajlar.png", 2.5, 1.05, 1.12),
        ("play-screenshot-04-ilan-ver.png", 2.5, 1.05, 1.12),
        ("play-promo-video-frame-cta.png", 3.5, 1.0, 1.06),
    ]

    all_frames: list[Image.Image] = []
    fade = int(0.6 * FPS)

    for idx, (name, duration, z_from, z_to) in enumerate(scenes):
        scene = make_scene_frames(load_frame(name), duration, zoom_from=z_from, zoom_to=z_to)
        if idx == 0:
            all_frames = scene
        else:
            all_frames = crossfade(all_frames, scene, fade)

    out_path = OUT / "pazaryeri-tanitim-videosu-1080x1920.mp4"
    writer = imageio.get_writer(
        out_path,
        fps=FPS,
        codec="libx264",
        quality=8,
        macro_block_size=1,
        ffmpeg_params=["-pix_fmt", "yuv420p"],
    )

    for frame in all_frames:
        writer.append_data(np.asarray(frame.convert("RGB")))
    writer.close()
    print(f"OK {out_path.name} ({len(all_frames) / FPS:.1f}s)")
    return out_path


def write_readme() -> None:
    readme = OUT / "NASIL-KULLANILIR.txt"
    readme.write_text(
        """PAZARYERİ — GOOGLE PLAY STORE GÖRSELLERİ VE TANITIM VİDEOSU
================================================================

Bu klasördeki dosyaları doğrudan Google Play Console'a yükleyebilirsiniz.

DOSYALAR
--------
00-uygulama-ikonu-512x512.png      → Mağaza girişi → Uygulama ikonu (512x512)
01-feature-graphic-1024x500.jpg     → Mağaza girişi → Öne çıkan grafik (1024x500)
02-ekran-kesfet-1080x1920.jpg       → Telefon ekran görüntüsü
03-ekran-ilan-detay-1080x1920.jpg   → Telefon ekran görüntüsü
04-ekran-mesajlar-1080x1920.jpg     → Telefon ekran görüntüsü
05-ekran-ilan-ver-1080x1920.jpg     → Telefon ekran görüntüsü
pazaryeri-tanitim-videosu-1080x1920.mp4 → Tanıtım videosu (~22 sn)

PLAY CONSOLE ADIMLARI
---------------------
1. Play Console → Pazaryeri → Büyütme → Mağaza girişi → Varsayılan mağaza girişi
2. Uygulama ikonu: 00-uygulama-ikonu-512x512.png
3. Öne çıkan grafik: 01-feature-graphic-1024x500.jpg
4. Telefon ekran görüntüleri: 02, 03, 04, 05 dosyalarını sırayla yükle
5. Tanıtım videosu:
   - Videoyu YouTube'a yükleyin (gizli veya herkese açık)
   - Play Console'da video URL'sini ekleyin
   VEYA
   - pazaryeri-tanitim-videosu-1080x1920.mp4 dosyasını referans olarak kullanın

NOT
---
• Ekran görüntüleri AI ile üretilmiş tanıtım mockup'larıdır.
  İsterseniz gerçek uygulama ekran görüntüleriyle değiştirebilirsiniz.
• Video dikey (9:16) formatındadır; YouTube Shorts olarak da paylaşılabilir.
""",
        encoding="utf-8",
    )
    print(f"OK {readme.name}")


def main() -> None:
    ensure_dir()
    process_static_assets()
    build_promo_video()
    write_readme()
    print(f"\nTüm dosyalar hazır: {OUT}")


if __name__ == "__main__":
    main()
