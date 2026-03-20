import { requestFFmpegWorker } from "@web-speed-hackathon-2026/client/src/utils/ffmpeg_worker_client";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  const outputBuffer = await requestFFmpegWorker(
    {
      type: "convert-movie",
      fileBuffer,
      extension: options.extension,
      size: options.size,
    },
    [fileBuffer],
  );

  return new Blob([outputBuffer]);
}
