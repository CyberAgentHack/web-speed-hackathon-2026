import {
  createFFmpegTempFileName,
  loadFFmpeg,
} from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size: number;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  const cropOptions = [`'min(iw,ih)':'min(iw,ih)'`, `scale=${options.size}:${options.size}`].join(
    ",",
  );
  const inputFile = createFFmpegTempFileName("movie-input");
  const exportFile = createFFmpegTempFileName("movie-output", options.extension);

  await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

  try {
    await ffmpeg.exec([
      "-i",
      inputFile,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      `crop=${cropOptions}`,
      "-an",
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
