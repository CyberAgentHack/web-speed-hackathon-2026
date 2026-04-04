import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const { loadFFmpeg } = await import("@web-speed-hackathon-2026/client/src/utils/load_ffmpeg");
  const ffmpeg = await loadFFmpeg();

  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  // 文字化けを防ぐためにメタデータを抽出して付与し直す（同一 FFmpeg インスタンスで実施）
  const metadata = await extractMetadataFromSound(file, ffmpeg);

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

  const blob = new Blob([output]);
  return blob;
}
