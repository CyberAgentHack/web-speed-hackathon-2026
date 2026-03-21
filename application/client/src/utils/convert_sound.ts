import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  // 文字化けを防ぐためにメタデータを抽出して付与し直す
  const metadata = await extractMetadataFromSound(file);

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

  const blob = new Blob([output]);
  return blob;
}
