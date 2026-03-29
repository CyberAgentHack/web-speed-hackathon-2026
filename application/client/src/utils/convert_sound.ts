import Encoding from "encoding-japanese";

import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

function parseFFmetadata(ffmetadata: string): { artist: string; title: string } {
  const entries = Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  );
  return {
    artist: (entries["artist"] as string | undefined) ?? UNKNOWN_ARTIST,
    title: (entries["title"] as string | undefined) ?? UNKNOWN_TITLE,
  };
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  const fileBytes = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile("file", fileBytes);

  // 文字化けを防ぐためにメタデータを抽出して付与し直す（同一セッションで実行）
  let metadata = { artist: UNKNOWN_ARTIST, title: UNKNOWN_TITLE };
  try {
    const metaFile = "meta.txt";
    await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", metaFile]);
    const metaOutput = (await ffmpeg.readFile(metaFile)) as Uint8Array<ArrayBuffer>;
    const metaUtf8 = Encoding.convert(metaOutput, { to: "UNICODE", from: "AUTO", type: "string" });
    metadata = parseFFmetadata(metaUtf8);
  } catch {
    // メタデータ抽出失敗時はデフォルト値を使用
  }

  const exportFile = `export.${options.extension}`;
  await ffmpeg.exec([
    "-i",
    "file",
    "-metadata",
    `artist=${metadata.artist}`,
    "-metadata",
    `title=${metadata.title}`,
    "-vn",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  return new Blob([output]);
}
