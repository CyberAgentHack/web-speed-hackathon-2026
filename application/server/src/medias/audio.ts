import Encoding from "encoding-japanese";

import { OfflineAudioContext } from "node-web-audio-api";

import fs from "node:fs/promises";
import { runShellCommand } from "./process";
import chunk from "lodash.chunk";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

export async function extractMetadataFromSound(path: string): Promise<SoundMetadata> {
  try {
    const exportFile = "meta.txt";

    await runShellCommand("ffmpeg", [
      "-i", path, "-y", "-f", "ffmetadata", exportFile
    ]);

    console.log("Returned");

    // If the audio file's metadata is written in SJIS, this content is also SJIS...
    const metadataStream = await fs.readFile(exportFile);

    // ...so we ask this library to handle that
    const outputUtf8 = Encoding.convert(metadataStream, {
      from: "AUTO",
      to: "UNICODE",
      type: "string",
    });

    const meta = parseFFmetadata(outputUtf8);

    console.log(meta);

    return {
      artist: meta.artist ?? UNKNOWN_ARTIST,
      title: meta.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  ) as Partial<SoundMetadata>;
}

export async function tinifyAudio(path: string, output: string) {
  return await runShellCommand(
    "ffmpeg", [
      "-i", path,
      "-c:a", "libopus",
      "-b:a", "64k",
      output,
    ]
  );
}

export interface SoundWavePoints {
  max: number;
  peaks: number[]
}

export async function createSoundWave(path: string): Promise<SoundWavePoints> {
  const data = await fs.readFile(path);

  console.log("Handling the sound wave");

  // This args doesn't matter
  const audioCtx = new OfflineAudioContext(2, 44100, 44100);

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.buffer as ArrayBuffer);
  // 左の音声データの絶対値を取る
  const leftData = buffer.getChannelData(0).map(Math.abs);
  // 右の音声データの絶対値を取る

  let rightData;
  try {
    rightData = buffer.getChannelData(1).map(Math.abs);
  } catch {
    // There are only one channel
    rightData = [];
  }

  console.log("The audio data was retrieved");

  // 左右の音声データの平均を取る
  const normalized = leftData.map((_, i) => {
    const left = leftData[i];
    const right = rightData[i];

    if(left == undefined || right == undefined) {
      return left ?? right ?? 0;
    }
    return left + right / 2;
  });

  console.log("Chunking");

  // 100 個の chunk に分ける
  const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
  // chunk ごとに平均を取る
  const peaks = chunks.map((chunk) => chunk.reduce((prev, cur) => prev + cur) / chunk.length);
  // chunk の平均の中から最大値を取る
  const max = Math.max(...peaks);

  console.log("Chunked, ", max);

  return { max, peaks };
}

