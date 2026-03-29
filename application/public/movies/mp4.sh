#!/bin/bash

for f in *.gif; do
    ffmpeg -i "$f" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${f%.gif}.mp4"
done