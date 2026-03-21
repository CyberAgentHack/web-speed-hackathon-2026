#!/usr/bin/env node
/**
 * Pre-compute waveform peaks for all MP3 files in public/sounds/.
 *
 * Approach: read the MP3 as a Buffer, skip the first 1000 bytes (ID3 header
 * region), then sample 100 evenly-spaced byte values from the remaining data
 * and normalise to [0, 1].  This is a fast heuristic that avoids any native
 * audio-decoding dependency while producing a visually plausible waveform.
 *
 * Output: application/public/waveforms/{id}.json
 *   { "peaks": [<100 numbers 0..1>], "max": 1.0 }
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, basename, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const SOUNDS_DIR = join(__dirname, "../public/sounds");
const WAVEFORMS_DIR = join(__dirname, "../public/waveforms");
const NUM_PEAKS = 100;
const SKIP_BYTES = 1000;

mkdirSync(WAVEFORMS_DIR, { recursive: true });

const files = readdirSync(SOUNDS_DIR).filter((f) => extname(f).toLowerCase() === ".mp3");

if (files.length === 0) {
  console.error("No MP3 files found in", SOUNDS_DIR);
  process.exit(1);
}

for (const file of files) {
  const id = basename(file, ".mp3");
  const filePath = join(SOUNDS_DIR, file);
  const buf = readFileSync(filePath);

  // Use the body of the MP3 (skip header bytes)
  const start = Math.min(SKIP_BYTES, buf.length);
  const body = buf.subarray(start);

  const peaks = [];
  const step = Math.max(1, Math.floor(body.length / NUM_PEAKS));

  for (let i = 0; i < NUM_PEAKS; i++) {
    const byteIndex = i * step;
    if (byteIndex >= body.length) {
      peaks.push(0);
    } else {
      // Normalise unsigned byte [0,255] to [0,1]
      peaks.push((body[byteIndex] ?? 0) / 255);
    }
  }

  const max = 1.0;

  const outPath = join(WAVEFORMS_DIR, `${id}.json`);
  writeFileSync(outPath, JSON.stringify({ max, peaks }));
  console.log(`Generated ${outPath}`);
}

console.log(`Done. Generated ${files.length} waveform file(s).`);
