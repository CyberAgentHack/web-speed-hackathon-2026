interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const { loadFFmpeg } = await import("@web-speed-hackathon-2026/client/src/utils/load_ffmpeg");
  const ffmpeg = await loadFFmpeg();

  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  const baseArgs = [
    "-i",
    "file",
    "-t",
    "5",
    "-r",
    "10",
    "-vf",
    `crop=${cropOptions}`,
    "-an",
  ] as const;

  const encodeArgs =
    options.extension === "mp4"
      ? [...baseArgs, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", exportFile]
      : [...baseArgs, exportFile];

  await ffmpeg.exec(encodeArgs);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  const blob = new Blob([output]);
  return blob;
}
