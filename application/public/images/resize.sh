#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <folder> <out>"
  exit 1
fi

FOLDER="$1"
OUT="$2"

mkdir -p "$OUT"

for img in "$FOLDER"/*.{jpg,jpeg,png}; do
    if [ -f "$img" ]; then
        convert "$img" -resize 256x "$OUT/$(basename "$img")"
    fi
done