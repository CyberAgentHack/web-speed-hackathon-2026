import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 1 秒のみ、正方形にくり抜かれた軽量な無音 GIF を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    options.size ? `scale=${options.size}:${options.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const filter = [`fps=4`, `crop=${cropOptions}`].join(",");
  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  await ffmpeg.exec([
    "-i",
    "file",
    "-t",
    "1",
    "-vf",
    filter,
    "-an",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  const blob = new Blob([output]);
  return blob;
}
