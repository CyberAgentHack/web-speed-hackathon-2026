import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export type MediaKind = "images" | "movies" | "sounds";

export interface SoundMetadata {
  artist?: string;
  title?: string;
}

const MEDIA_CANONICAL_EXTENSIONS = {
  images: "jpg",
  movies: "mp4",
  sounds: "mp3",
} as const;

const MEDIA_DERIVATIVE_EXTENSIONS = {
  images: ["avif", "webp"],
  movies: ["webm"],
  sounds: ["ogg"],
} as const;

type ImageOutputExt = (typeof MEDIA_DERIVATIVE_EXTENSIONS.images)[number] | "jpg";
type MovieOutputExt = (typeof MEDIA_DERIVATIVE_EXTENSIONS.movies)[number] | "mp4";
type SoundOutputExt = (typeof MEDIA_DERIVATIVE_EXTENSIONS.sounds)[number] | "mp3";

function getCanonicalExtension(kind: MediaKind): string {
  return MEDIA_CANONICAL_EXTENSIONS[kind];
}

function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1).toLowerCase();
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function safeResolveWithin(rootPath: string, relativePath: string): string | undefined {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedPath = path.resolve(rootPath, relativePath);
  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    return undefined;
  }
  return resolvedPath;
}

async function writeFileWithParent(filePath: string, data: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
}

async function copyFileWithParent(sourcePath: string, outputPath: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.copyFile(sourcePath, outputPath);
}

async function runFfmpeg(args: string[]): Promise<void> {
  const binaryPath = ffmpegPath;
  if (binaryPath == null) {
    throw new Error("ffmpeg-static binary is unavailable");
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      binaryPath,
      ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", ...args],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    ) as import("node:child_process").ChildProcess;

    const stderr = child.stderr;
    if (stderr === null) {
      reject(new Error("ffmpeg stderr stream is unavailable"));
      return;
    }

    let stderrOutput = "";
    stderr.setEncoding("utf8");
    stderr.on("data", (chunk: string) => {
      stderrOutput += chunk;
    });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `ffmpeg exited with code ${code ?? "null"}${
            stderrOutput ? `: ${stderrOutput.trim()}` : ""
          }`,
        ),
      );
    });
  });
}

async function createImageVariant(
  sourcePath: string,
  outputPath: string,
  outputExt: ImageOutputExt,
): Promise<void> {
  if (getFileExtension(sourcePath) === outputExt) {
    await copyFileWithParent(sourcePath, outputPath);
    return;
  }

  const pipeline = sharp(sourcePath).withMetadata();
  if (outputExt === "jpg") {
    await pipeline.jpeg({ quality: 85 }).toFile(outputPath);
    return;
  }
  if (outputExt === "webp") {
    await pipeline.webp({ quality: 80 }).toFile(outputPath);
    return;
  }

  await pipeline.avif({ quality: 50 }).toFile(outputPath);
}

async function createMovieVariant(
  sourcePath: string,
  outputPath: string,
  outputExt: MovieOutputExt,
): Promise<void> {
  if (getFileExtension(sourcePath) === outputExt) {
    await copyFileWithParent(sourcePath, outputPath);
    return;
  }

  const baseArgs = [
    "-i",
    sourcePath,
    "-t",
    "5",
    "-r",
    "10",
    "-vf",
    "crop='min(iw,ih)':'min(iw,ih)'",
    "-an",
  ];

  if (outputExt === "mp4") {
    await runFfmpeg([
      ...baseArgs,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      outputPath,
    ]);
    return;
  }

  await runFfmpeg([
    ...baseArgs,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "32",
    outputPath,
  ]);
}

async function createSoundVariant(
  sourcePath: string,
  outputPath: string,
  outputExt: SoundOutputExt,
  metadata: SoundMetadata,
): Promise<void> {
  if (getFileExtension(sourcePath) === outputExt) {
    await copyFileWithParent(sourcePath, outputPath);
    return;
  }

  const metadataArgs: string[] = [];
  if (metadata.artist !== undefined) {
    metadataArgs.push("-metadata", `artist=${metadata.artist}`);
  }
  if (metadata.title !== undefined) {
    metadataArgs.push("-metadata", `title=${metadata.title}`);
  }

  if (outputExt === "mp3") {
    await runFfmpeg([
      "-i",
      sourcePath,
      ...metadataArgs,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "4",
      "-vn",
      outputPath,
    ]);
    return;
  }

  await runFfmpeg([
    "-i",
    sourcePath,
    ...metadataArgs,
    "-c:a",
    "libvorbis",
    "-q:a",
    "4",
    "-vn",
    outputPath,
  ]);
}

export function getMediaSourcePath(kind: MediaKind, id: string, ext: string): string {
  return path.resolve(UPLOAD_PATH, "source", kind, `${id}.${ext}`);
}

export function getMediaPath(kind: MediaKind, id: string, ext = getCanonicalExtension(kind)): string {
  return path.resolve(UPLOAD_PATH, kind, `${id}.${ext}`);
}

export function getMediaDerivativeExtensions(kind: MediaKind): readonly string[] {
  return MEDIA_DERIVATIVE_EXTENSIONS[kind];
}

export async function storeMediaSource(
  kind: MediaKind,
  id: string,
  ext: string,
  data: Buffer,
): Promise<string> {
  const sourcePath = getMediaSourcePath(kind, id, ext);
  await writeFileWithParent(sourcePath, data);
  return sourcePath;
}

export async function createCanonicalMedia(
  kind: MediaKind,
  sourcePath: string,
  outputPath: string,
  metadata: SoundMetadata = {},
): Promise<void> {
  if (kind === "images") {
    await createImageVariant(sourcePath, outputPath, "jpg");
    return;
  }
  if (kind === "movies") {
    await createMovieVariant(sourcePath, outputPath, "mp4");
    return;
  }

  await createSoundVariant(sourcePath, outputPath, "mp3", metadata);
}

export async function createDerivativeMedia(
  kind: MediaKind,
  sourcePath: string,
  outputPath: string,
  metadata: SoundMetadata = {},
): Promise<void> {
  const ext = getFileExtension(outputPath) as ImageOutputExt | MovieOutputExt | SoundOutputExt;
  if (kind === "images") {
    await createImageVariant(sourcePath, outputPath, ext as ImageOutputExt);
    return;
  }
  if (kind === "movies") {
    await createMovieVariant(sourcePath, outputPath, ext as MovieOutputExt);
    return;
  }

  await createSoundVariant(sourcePath, outputPath, ext as SoundOutputExt, metadata);
}

export async function storeMediaAndCreateCanonical(
  kind: MediaKind,
  id: string,
  sourceExt: string,
  data: Buffer,
  metadata: SoundMetadata = {},
): Promise<string> {
  const sourcePath = await storeMediaSource(kind, id, sourceExt, data);
  await createCanonicalMedia(kind, sourcePath, getMediaPath(kind, id), metadata);
  return sourcePath;
}

export async function resolveMediaPath(relativePath: string, kind: MediaKind): Promise<string | undefined> {
  const canonicalExt = getCanonicalExtension(kind);
  const parsed = path.posix.parse(relativePath);
  const canonicalRelativePath = path.posix.join(parsed.dir, `${parsed.name}.${canonicalExt}`);

  for (const rootPath of [UPLOAD_PATH, PUBLIC_PATH]) {
    const directPath = safeResolveWithin(rootPath, relativePath);
    if (directPath !== undefined && (await pathExists(directPath))) {
      return directPath;
    }

    if (canonicalRelativePath !== relativePath) {
      const canonicalPath = safeResolveWithin(rootPath, canonicalRelativePath);
      if (canonicalPath !== undefined && (await pathExists(canonicalPath))) {
        return canonicalPath;
      }
    }
  }

  return undefined;
}
