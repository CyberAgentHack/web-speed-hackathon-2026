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

  const targetSize = options.size ?? 320;
  const fps = 8;
  const maxColors = 96;
  const filterGraph = [
    `crop=min(iw\\,ih):min(iw\\,ih)`,
    `fps=${fps}`,
    `scale=${targetSize}:${targetSize}:flags=lanczos`,
  ].join(",");
  const paletteGraph = [
    `${filterGraph},split[s0][s1]`,
    `[s0]palettegen=max_colors=${maxColors}[p]`,
    "[s1][p]paletteuse=dither=bayer",
  ].join(";");
  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  await ffmpeg.exec([
    "-i",
    "file",
    "-t",
    "5",
    "-filter_complex",
    paletteGraph,
    "-an",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  ffmpeg.terminate();

  const blob = new Blob([output]);
  return blob;
}
