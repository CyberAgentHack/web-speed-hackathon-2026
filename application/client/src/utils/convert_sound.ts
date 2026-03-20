import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const inputFile = `sound-${jobId}.input`;

  const exportFile = `sound-${jobId}.${options.extension}`;

  await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

  // 文字化けを防ぐためにメタデータを抽出して付与し直す
  const metadata = await extractMetadataFromSound(file);

  await ffmpeg.exec([
    "-i",
    inputFile,
    "-metadata",
    `artist=${metadata.artist}`,
    "-metadata",
    `title=${metadata.title}`,
    "-vn",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;
  await ffmpeg.deleteFile(inputFile).catch(() => {});
  await ffmpeg.deleteFile(exportFile).catch(() => {});

  const blob = new Blob([output]);
  return blob;
}
