#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path

def convert_sounds():
    base_dir = Path(__file__).parent.parent / 'application' / 'public' / 'sounds'

    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        sys.exit(1)

    total_converted = 0
    total_size_saved = 0

    # Convert MP3 files to Opus
    mp3_files = list(base_dir.glob('*.mp3'))
    if mp3_files:
        print(f"Converting {len(mp3_files)} MP3 files to Opus (64kbps)...")
        for mp3_path in mp3_files:
            try:
                opus_path = mp3_path.with_suffix('.opus')

                # Get original size
                original_size = mp3_path.stat().st_size

                # Convert to Opus using ffmpeg
                result = subprocess.run([
                    'ffmpeg',
                    '-i', str(mp3_path),
                    '-c:a', 'libopus',
                    '-b:a', '64k',
                    '-y',  # Overwrite output file without asking
                    str(opus_path)
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                if result.returncode != 0:
                    print(f"ERROR {mp3_path.name}: ffmpeg conversion failed")
                    continue

                # Get new size
                new_size = opus_path.stat().st_size
                reduction = ((1 - new_size / original_size) * 100)

                # Delete original
                mp3_path.unlink()

                print(f"OK {mp3_path.name}: {original_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB ({reduction:.1f}% reduction)")

                total_converted += 1
                total_size_saved += original_size - new_size
            except Exception as e:
                print(f"ERROR {mp3_path.name}: {e}")

    print(f"\nComplete!")
    print(f"  Total converted: {total_converted} files")
    print(f"  Total size saved: {total_size_saved/1024/1024:.2f}MB")

if __name__ == '__main__':
    convert_sounds()
