import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
import { requestFFmpegWorker } from "@web-speed-hackathon-2026/client/src/utils/ffmpeg_worker_client";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  // 文字化けを防ぐためにメタデータを抽出して付与し直す
  const metadata = await extractMetadataFromSound(file);

  const fileBuffer = await file.arrayBuffer();
  const outputBuffer = await requestFFmpegWorker(
    {
      type: "convert-sound",
      fileBuffer,
      extension: options.extension,
      artist: metadata.artist,
      title: metadata.title,
    },
    [fileBuffer],
  );

  return new Blob([outputBuffer]);
}
