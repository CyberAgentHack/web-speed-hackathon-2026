import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(
  file: File,
  options: Options,
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log(message);
  });

  const cropOptions = [
    "'min(iw,ih):min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  try {
    await ffmpeg.exec([
      "-i",
      "file",
      "-t",
      "5",
      "-r",
      "10",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      `crop=${cropOptions}`,
      "-movflags",
      "+faststart",
      "-an",
      exportFile,
    ]);

    const output = (await ffmpeg.readFile(
      exportFile,
    )) as Uint8Array<ArrayBuffer>;

    console.log(output);

    ffmpeg.terminate();

    const blob = new Blob([output]);
    return blob;
  } catch (error) {
    console.error("Error converting movie:", error);
    throw error;
  }
}
