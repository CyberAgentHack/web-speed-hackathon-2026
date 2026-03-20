// import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
// import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const { loadFFmpeg } = await import("./load_ffmpeg");
  const ffmpeg = await loadFFmpeg();

  const exportFile = `export.${options.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  // パフォーマンス向上のため、メタデータの抽出と再付与を停止
  await ffmpeg.exec([
    "-i",
    "file",
    "-vn",
    exportFile,
  ]);

  const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  // ffmpeg.terminate(); // Singleton インスタンスを維持するため削除

  const blob = new Blob([output]);
  return blob;
}
