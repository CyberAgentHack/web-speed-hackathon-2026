import { runShellCommand } from "./process";

const SIZE = 500;

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function cropMovie(path: string, output: string) {
  const cropOptions = ["'min(iw,ih)':'min(iw,ih)'", `scale=${SIZE}:${SIZE}`]
    .join(",");

  return await runShellCommand(
    "ffmpeg", [
      "-i",
      path,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      `crop=${cropOptions}`,
      "-an",
      output,
    ]
  );
}

