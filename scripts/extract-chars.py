#!/usr/bin/env python3
import os
import re
import glob

# Japanese character pattern
pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3005\u3006\u3007]')

chars = set()

seeds_dir = "/Users/yukiono/web-speed-hackathon-2026/application/server/seeds"
for jsonl_file in glob.glob(os.path.join(seeds_dir, "*.jsonl")):
    print(f"Processing {os.path.basename(jsonl_file)}...")
    with open(jsonl_file, 'r', encoding='utf-8') as f:
        for line in f:
            found = pattern.findall(line)
            chars.update(found)

# Add common characters (numbers, punctuation, ASCII)
common = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
common += "！？。、・「」『』【】（）〈〉《》〔〕［］｛｝"
common += "…―～ー＝≠≤≥＋−×÷％＃＆＊＠"
common += " \n\t"
chars.update(common)

# Write to file
output_file = "/Users/yukiono/web-speed-hackathon-2026/scripts/used-chars.txt"
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(''.join(sorted(chars)))

print(f"Total unique characters: {len(chars)}")
print(f"Output written to: {output_file}")
