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

  const baseFilter = [
    "crop='min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}:flags=lanczos` : undefined,
    "fps=10",
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  const filterArguments =
    options.extension === "webm"
      ? ["-vf", baseFilter]
      : [
          "-filter_complex",
          `${baseFilter},split[v1][v2];[v1]palettegen=stats_mode=diff[p];[v2][p]paletteuse=dither=bayer:bayer_scale=5`,
        ];

  await ffmpeg.exec([
    "-i",
    "file",
    "-t",
    "5",
    ...(options.extension === "webm"
      ? ["-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "5", "-b:v", "0", "-crf", "32"]
      : []),
    ...filterArguments,
    "-an",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  const blob = new Blob([output]);
  return blob;
}
