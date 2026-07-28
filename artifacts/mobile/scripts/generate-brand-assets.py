"""Pazaryeri marka görselleri — mevcut icon'dan türevler üretir."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "assets" / "images"
SRC = ROOT / "icon.png"


def pad_center(src: Image.Image, out_size: int, content_ratio: float, bg=None) -> Image.Image:
    content = int(out_size * content_ratio)
    resized = src.resize((content, content), Image.Resampling.LANCZOS)
    if bg:
        canvas = Image.new("RGBA", (out_size, out_size), bg)
    else:
        canvas = Image.new("RGBA", (out_size, out_size), (0, 0, 0, 0))
    offset = (out_size - content) // 2
    if resized.mode != "RGBA":
        resized = resized.convert("RGBA")
    canvas.paste(resized, (offset, offset), resized)
    return canvas


def make_notification(src: Image.Image) -> Image.Image:
    mono = src.resize((96, 96), Image.Resampling.LANCZOS).convert("RGBA")
    pixels = mono.load()
    for y in range(96):
        for x in range(96):
            r, g, b, a = pixels[x, y]
            if a > 30:
                pixels[x, y] = (255, 255, 255, min(255, a + 40))
            else:
                pixels[x, y] = (0, 0, 0, 0)
    return mono


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Kaynak ikon bulunamadı: {SRC}")

    icon = Image.open(SRC).convert("RGBA")
    if icon.size != (1024, 1024):
        icon = icon.resize((1024, 1024), Image.Resampling.LANCZOS)
        icon.save(SRC, "PNG", optimize=True)

    pad_center(icon, 1024, 0.42).save(ROOT / "splash-icon.png", "PNG", optimize=True)
    pad_center(icon, 1024, 0.62).save(ROOT / "adaptive-icon.png", "PNG", optimize=True)
    icon.resize((48, 48), Image.Resampling.LANCZOS).save(ROOT / "favicon.png", "PNG", optimize=True)
    pad_center(icon, 256, 0.78).save(ROOT / "logo-mark.png", "PNG", optimize=True)
    make_notification(icon).save(ROOT / "notification-icon.png", "PNG", optimize=True)
    print("Brand derivatives generated:", ROOT)


if __name__ == "__main__":
    main()
