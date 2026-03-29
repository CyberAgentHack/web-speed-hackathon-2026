#!/usr/bin/env python3
import re
import os
import xml.etree.ElementTree as ET

# Register namespaces
ET.register_namespace('', 'http://www.w3.org/2000/svg')

# Used icons from the codebase
USED_ICONS = {
    'solid': [
        'paper-plane', 'arrow-down', 'arrow-right', 'play', 'pause',
        'exclamation-circle', 'images', 'music', 'video', 'circle-notch',
        'home', 'search', 'envelope', 'edit', 'user', 'sign-in-alt',
        'balance-scale'
    ],
    'regular': [
        'calendar-alt'
    ],
    'brands': []
}

BASE_DIR = '/Users/yukiono/web-speed-hackathon-2026/application/public/sprites/font-awesome'

def extract_used_icons(input_file, output_file, used_ids):
    """Extract only used icons from SVG sprite"""
    tree = ET.parse(input_file)
    root = tree.getroot()

    # Find all symbol elements
    symbols_to_keep = []
    symbols_to_remove = []

    for symbol in root.findall('.//{http://www.w3.org/2000/svg}symbol'):
        symbol_id = symbol.get('id')
        if symbol_id in used_ids:
            symbols_to_keep.append(symbol_id)
        else:
            symbols_to_remove.append(symbol)

    # Remove unused symbols
    for symbol in symbols_to_remove:
        root.remove(symbol)

    # Write output
    tree.write(output_file, encoding='unicode', xml_declaration=True)

    return len(symbols_to_keep), len(symbols_to_remove)

def main():
    for style, icons in USED_ICONS.items():
        input_file = os.path.join(BASE_DIR, f'{style}.svg')
        output_file = os.path.join(BASE_DIR, f'{style}.optimized.svg')
        backup_file = os.path.join(BASE_DIR, f'{style}.full.svg')

        if not os.path.exists(input_file):
            print(f"Skipping {style}.svg (not found)")
            continue

        if not icons:
            print(f"Skipping {style}.svg (no icons used)")
            continue

        print(f"Processing {style}.svg...")
        print(f"  Used icons: {icons}")

        kept, removed = extract_used_icons(input_file, output_file, icons)
        print(f"  Kept: {kept}, Removed: {removed}")

        # Get file sizes
        orig_size = os.path.getsize(input_file)
        new_size = os.path.getsize(output_file)
        reduction = (1 - new_size / orig_size) * 100

        print(f"  Size: {orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")

        # Backup original and replace
        os.rename(input_file, backup_file)
        os.rename(output_file, input_file)

    print("\nDone!")

if __name__ == '__main__':
    main()
