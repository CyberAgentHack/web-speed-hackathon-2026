#!/bin/bash

mkdir -p ./converted

for f in *.gif; do
    ffmpeg -i "$f" -vf "scale=480:-1:flags=lanczos" ./converted/"$f"
done