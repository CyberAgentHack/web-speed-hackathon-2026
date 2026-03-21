import { spawn } from "child_process";
import { readFile, unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import Encoding from "encoding-japanese";

interface Options {
  extension: string;
  size?: number | undefined;
}

export async function convertMovie(
  buf: Buffer,
  options: Options,
): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `input_${Date.now()}.${options.extension}`);
  const outputPath = path.join(tmpDir, `output_${Date.now()}.${options.extension}`);

  await writeFile(inputPath, buf);
  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");

  const ffmpegArgs = [
    "-i",
    inputPath,
    "-t",
    "5",
    "-r",
    "10",
    "-vf",
    `crop=${cropOptions}`,
    "-an",
    outputPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", ffmpegArgs);

    process.on("error", (err) => {
      reject(err);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const output = await readFile(outputPath);

  await unlink(inputPath);
  await unlink(outputPath);

  return output;
}

interface SoundOptions {
  extension: string;
}

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function convertSound(
  buf: Buffer,
  options: SoundOptions,
): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `input_${Date.now()}.${options.extension}`);
  const outputPath = path.join(tmpDir, `output_${Date.now()}.${options.extension}`);
  const metaPath = path.join(tmpDir, `meta_${Date.now()}.txt`);

  await writeFile(inputPath, buf);

  console.log("Extracting metadata with ffmpeg...");

  await new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-f",
      "ffmetadata",
      metaPath,
    ]);

    process.stdout.on("data", (data) => {
      console.log(`ffmpeg stdout: ${data}`);
    });

    process.stderr.on("data", (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });

    process.on("error", (err) => {
      console.error("Error spawning ffmpeg for metadata extraction:", err);
      reject(err);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`ffmpeg exited with code ${code} during metadata extraction`);
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const metadata = await readFile(metaPath);

  const outputUtf8 = Encoding.convert(Buffer.from(metadata), {
    to: "UNICODE",
    from: "AUTO",
    type: "string",
  });
  const meta = parseFFmetadata(outputUtf8);
  const artist = meta.artist ?? UNKNOWN_ARTIST;
  const title = meta.title ?? UNKNOWN_TITLE;

  console.log("metadata extracted:", { artist, title });

  await new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-metadata",
      `artist=${artist}`,
      "-metadata",
      `title=${title}`,
      "-vn",
      outputPath,
    ]);

    process.on("error", (err) => {
      console.error("Error spawning ffmpeg for sound conversion:", err);
      reject(err);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`ffmpeg exited with code ${code} during sound conversion`);
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const output = await readFile(outputPath);

  await unlink(inputPath);
  await unlink(metaPath);
  await unlink(outputPath);

  return output;
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
