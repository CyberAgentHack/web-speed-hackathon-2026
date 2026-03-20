import { promises as fs } from "node:fs";
import path from "node:path";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const waveformCache = new Map<string, number[]>();

function calculateWaveform(bytes: Uint8Array): number[] {
  const bucketCount = 100;
  if (bytes.length === 0) {
    return [];
  }

  const chunkSize = Math.max(1, Math.floor(bytes.length / bucketCount));
  const peaks: number[] = [];

  for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
    const start = bucketIndex * chunkSize;
    if (start >= bytes.length) {
      break;
    }

    const end = Math.min(bytes.length, start + chunkSize);
    let sum = 0;
    for (let index = start; index < end; index += 1) {
      sum += Math.abs(bytes[index]! - 128);
    }

    peaks.push(sum / (end - start) / 128);
  }

  return peaks;
}

export function createSoundWaveform(data: Uint8Array<ArrayBufferLike>): number[] {
  return calculateWaveform(data);
}

export async function getSoundWaveform(soundId: string): Promise<number[]> {
  const cached = waveformCache.get(soundId);
  if (cached != null) {
    return cached;
  }

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.mp3`);
  const data = await fs.readFile(filePath);
  const waveform = calculateWaveform(data);
  waveformCache.set(soundId, waveform);
  return waveform;
}

