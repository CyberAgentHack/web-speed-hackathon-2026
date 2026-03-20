import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const inputFile = `movie-${jobId}.input`;

  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `movie-${jobId}.${options.extension}`;

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
  await ffmpeg.deleteFile(inputFile).catch(() => {});
  await ffmpeg.deleteFile(exportFile).catch(() => {});

  const blob = new Blob([output]);
  return blob;
}
