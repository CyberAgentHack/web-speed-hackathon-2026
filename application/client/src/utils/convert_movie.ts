import { loadFFmpeg, releaseFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const jobId = crypto.randomUUID();
  const inputFile = `movie-${jobId}.input`;

  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `movie-${jobId}.${options.extension}`;

  try {
    await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

    await ffmpeg.exec([
      "-i",
      inputFile,
      "-t",
      "5",
      "-r",
      "5",
      "-vf",
      `crop=${cropOptions}`,
      "-an",
      exportFile,
    ]);

    const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;
    return new Blob([output]);
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(inputFile).catch(() => {}), ffmpeg.deleteFile(exportFile).catch(() => {})]);
    // Terminate the ffmpeg worker to free SharedArrayBuffer and web worker resources.
    // This prevents the worker from throttling subsequent network I/O (fetch uploads).
    releaseFFmpeg();
  }
}
