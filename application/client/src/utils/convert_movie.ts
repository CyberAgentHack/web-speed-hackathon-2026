import { withFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size?: number | undefined;
}

let transcodeSequence = 0;

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const fileKey = `${Date.now()}-${transcodeSequence++}`;
  const inputFile = `movie-input-${fileKey}`;
  const exportFile = `movie-export-${fileKey}.${options.extension}`;

  return withFFmpeg(async (ffmpeg) => {
    const cropOptions = [
      "'min(iw,ih)':'min(iw,ih)'",
      options.size ? `scale=${options.size}:${options.size}` : undefined,
    ]
      .filter(Boolean)
      .join(",");

    await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

    const baseArgs = [
      "-i",
      inputFile,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      `crop=${cropOptions}`,
      "-an",
    ];
    if (options.extension === "mp4") {
      await ffmpeg.exec([
        ...baseArgs,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-movflags",
        "+faststart",
        exportFile,
      ]);
    } else {
      await ffmpeg.exec([...baseArgs, exportFile]);
    }

    const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

    await Promise.allSettled([ffmpeg.deleteFile(inputFile), ffmpeg.deleteFile(exportFile)]);

    return new Blob([output]);
  });
}
