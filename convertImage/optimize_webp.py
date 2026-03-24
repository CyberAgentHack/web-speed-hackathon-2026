#!/usr/bin/env python3
import sys
from pathlib import Path

from PIL import Image, ImageOps

TIMELINE_WIDTHS = [320, 640, 960, 1280]
PROFILE_WIDTHS = [64, 128, 256, 512]
QUALITY = 75
METHOD = 6


def resize_to_width(img: Image.Image, width: int) -> Image.Image:
    src_width, src_height = img.size
    if src_width <= width:
        return img.copy()

    target_height = round(src_height * width / src_width)
    return img.resize((width, target_height), Image.Resampling.LANCZOS)


def encode_webp(src_path: Path, widths: list[int]) -> tuple[int, int]:
    optimized_count = 0
    saved_bytes = 0

    with Image.open(src_path) as opened:
        img = ImageOps.exif_transpose(opened)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        original_size = src_path.stat().st_size
        img.save(src_path, "WEBP", quality=QUALITY, method=METHOD)
        reencoded_size = src_path.stat().st_size
        if original_size > reencoded_size:
            optimized_count += 1
            saved_bytes += original_size - reencoded_size

        for width in widths:
            if width >= img.size[0]:
                continue

            variant_path = src_path.with_name(f"{src_path.stem}-{width}w.webp")
            resized = resize_to_width(img, width)
            resized.save(variant_path, "WEBP", quality=QUALITY, method=METHOD)
            optimized_count += 1

    return optimized_count, saved_bytes


def optimize_directory(base_dir: Path, widths: list[int], label: str) -> tuple[int, int]:
    webp_files = [
        path
        for path in sorted(base_dir.glob("*.webp"))
        if "-320w" not in path.stem
        and "-640w" not in path.stem
        and "-960w" not in path.stem
        and "-1280w" not in path.stem
        and "-64w" not in path.stem
        and "-128w" not in path.stem
        and "-256w" not in path.stem
        and "-512w" not in path.stem
    ]
    if not webp_files:
      return 0, 0

    print(f"Optimizing {len(webp_files)} WebP files in {label}...")

    total_optimized = 0
    total_saved = 0
    for webp_path in webp_files:
        try:
            optimized_count, saved_bytes = encode_webp(webp_path, widths)
            total_optimized += optimized_count
            total_saved += saved_bytes
            print(f"[OK] {webp_path.name}")
        except Exception as exc:
            print(f"[ERROR] {webp_path.name}: {exc}")

    return total_optimized, total_saved


def optimize_webp_files() -> None:
    base_dir = Path(__file__).parent.parent / "application" / "public" / "images"
    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        sys.exit(1)

    total_optimized = 0
    total_saved = 0

    optimized, saved = optimize_directory(base_dir, TIMELINE_WIDTHS, "root")
    total_optimized += optimized
    total_saved += saved

    profiles_dir = base_dir / "profiles"
    if profiles_dir.exists():
        optimized, saved = optimize_directory(profiles_dir, PROFILE_WIDTHS, "profiles")
        total_optimized += optimized
        total_saved += saved

    print("\n" + "=" * 50)
    print("Complete!")
    print(f"  Total generated/optimized: {total_optimized} files")
    print(f"  Total size saved on originals: {total_saved / 1024:.1f}KB ({total_saved / 1024 / 1024:.2f}MB)")


if __name__ == "__main__":
    optimize_webp_files()
