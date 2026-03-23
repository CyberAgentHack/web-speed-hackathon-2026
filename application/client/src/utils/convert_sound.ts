import Encoding from "encoding-japanese";

import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

function parseFFmetadata(ffmetadata: string): Record<string, string> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  );
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  const fileData = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile("file", fileData);

  // メタデータ抽出（同じFFmpegインスタンスを再利用）
  let artist = UNKNOWN_ARTIST;
  let title = UNKNOWN_TITLE;
  try {
    await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", "meta.txt"]);
    const metaOutput = (await ffmpeg.readFile("meta.txt")) as Uint8Array<ArrayBuffer>;
    const outputUtf8 = Encoding.convert(metaOutput, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });
    const meta = parseFFmetadata(outputUtf8);
    artist = meta["artist"] ?? UNKNOWN_ARTIST;
    title = meta["title"] ?? UNKNOWN_TITLE;
  } catch {
    // メタデータ抽出失敗時はデフォルト値を使用
  }

  // 変換
  const exportFile = `export.${options.extension}`;
  await ffmpeg.exec([
    "-i",
    "file",
    "-metadata",
    `artist=${artist}`,
    "-metadata",
    `title=${title}`,
    "-vn",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  return new Blob([output]);
}
