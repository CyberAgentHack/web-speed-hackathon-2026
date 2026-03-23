import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
import {
  createFFmpegTempFileName,
  loadFFmpeg,
} from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const inputFile = createFFmpegTempFileName("sound-input");
  const exportFile = createFFmpegTempFileName("sound-output", options.extension);

  // 文字化けを防ぐためにメタデータを抽出して付与し直す
  const metadata = await extractMetadataFromSound(file);
  await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

  try {
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

    const blob = new Blob([output]);
    return blob;
  } finally {
    await Promise.all([
      ffmpeg.deleteFile(inputFile).catch(() => undefined),
      ffmpeg.deleteFile(exportFile).catch(() => undefined),
    ]);
  }
}
