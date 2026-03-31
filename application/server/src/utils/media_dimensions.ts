import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

import { readImageMetadata } from "@web-speed-hackathon-2026/server/src/utils/optimize_image";

const execFileAsync = promisify(execFile);

export interface MediaDimensions {
  height: number;
  width: number;
}

function assertPositiveDimensions(width: unknown, height: unknown): MediaDimensions {
  if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) {
    throw new Error("Invalid media dimensions");
  }

  return { height, width };
}

export async function readImageDimensionsFromBuffer(input: Buffer): Promise<MediaDimensions> {
  const metadata = await readImageMetadata(input);
  return assertPositiveDimensions(metadata.width, metadata.height);
}

export async function readImageDimensionsFromFile(filePath: string): Promise<MediaDimensions> {
  return readImageDimensionsFromBuffer(await fs.readFile(filePath));
}

async function readMovieDimensionsFromFilePath(filePath: string): Promise<MediaDimensions> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "json",
    filePath,
  ]);
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{
      height?: number;
      width?: number;
    }>;
  };
  const stream = parsed.streams?.[0];

  return assertPositiveDimensions(stream?.width, stream?.height);
}

export async function readMovieDimensionsFromFile(filePath: string): Promise<MediaDimensions> {
  return readMovieDimensionsFromFilePath(filePath);
}

export async function readMovieDimensionsFromBuffer(input: Buffer): Promise<MediaDimensions> {
  const dirPath = await fs.mkdtemp(path.join(tmpdir(), "cax-movie-dimensions-"));

  try {
    const inputPath = path.join(dirPath, "input.webm");
    await fs.writeFile(inputPath, input);
    return await readMovieDimensionsFromFilePath(inputPath);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}
