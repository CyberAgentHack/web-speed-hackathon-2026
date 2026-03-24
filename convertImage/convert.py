#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from PIL import Image

def resize_image(img, max_dimension):
    """Resize image to fit within max_dimension while maintaining aspect ratio"""
    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    return img

def convert_images():
    base_dir = Path(__file__).parent.parent / 'application' / 'public' / 'images'

    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        sys.exit(1)

    total_converted = 0
    total_size_saved = 0

    # Convert root images (timeline) - resize to 2048px, high quality
    jpg_files = list(base_dir.glob('*.jpg'))
    if jpg_files:
        print(f"Converting {len(jpg_files)} files in root (max 2048px, quality 80)...")
        for jpg_path in jpg_files:
            try:
                webp_path = jpg_path.with_suffix('.webp')

                # Get original size
                original_size = jpg_path.stat().st_size

                # Convert to WebP with resize
                img = Image.open(jpg_path)
                img = resize_image(img, 2048)
                img.save(webp_path, 'WEBP', quality=80, method=6)

                # Get new size
                new_size = webp_path.stat().st_size
                reduction = ((1 - new_size / original_size) * 100)

                # Delete original
                jpg_path.unlink()

                print(f"OK {jpg_path.name}: {original_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB ({reduction:.1f}% reduction)")

                total_converted += 1
                total_size_saved += original_size - new_size
            except Exception as e:
                print(f"ERROR {jpg_path.name}: {e}")

    # Convert profile images - resize to 800px, high quality
    profiles_dir = base_dir / 'profiles'
    if profiles_dir.exists():
        jpg_files = list(profiles_dir.glob('*.jpg'))
        if jpg_files:
            print(f"\nConverting {len(jpg_files)} files in profiles (max 800px, quality 80)...")
            for jpg_path in jpg_files:
                try:
                    webp_path = jpg_path.with_suffix('.webp')

                    # Get original size
                    original_size = jpg_path.stat().st_size

                    # Convert to WebP with resize
                    img = Image.open(jpg_path)
                    img = resize_image(img, 800)
                    img.save(webp_path, 'WEBP', quality=80, method=6)

                    # Get new size
                    new_size = webp_path.stat().st_size
                    reduction = ((1 - new_size / original_size) * 100)

                    # Delete original
                    jpg_path.unlink()

                    print(f"OK {jpg_path.name}: {original_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB ({reduction:.1f}% reduction)")

                    total_converted += 1
                    total_size_saved += original_size - new_size
                except Exception as e:
                    print(f"ERROR {jpg_path.name}: {e}")

    print(f"\nComplete!")
    print(f"  Total converted: {total_converted} files")
    print(f"  Total size saved: {total_size_saved/1024/1024:.2f}MB")

if __name__ == '__main__':
    convert_images()
