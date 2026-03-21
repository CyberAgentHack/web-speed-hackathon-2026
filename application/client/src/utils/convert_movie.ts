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

  const cropOptions = [
    "crop='min(iw,ih)':'min(iw,ih)'",
    options.size != null ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");

  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  if (options.extension === "mp4") {
    await ffmpeg.exec([
      "-i",
      "file",
      "-t",
      "5",
      "-vf",
      cropOptions,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      exportFile,
    ]);
  } else if (options.extension === "webm") {
    await ffmpeg.exec([
      "-i",
      "file",
      "-t",
      "5",
      "-vf",
      cropOptions,
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "32",
      "-b:v",
      "0",
      exportFile,
    ]);
  } else {
    await ffmpeg.exec([
      "-i",
      "file",
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      cropOptions,
      "-an",
      exportFile,
    ]);
  }

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  return new Blob([output]);
}