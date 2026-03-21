import { extractMetadataFromSound } from "@web-speed-hackathon-2026/client/src/utils/extract_metadata_from_sound";
import { withFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface Options {
  extension: string;
}

let transcodeSequence = 0;

export async function convertSound(file: File, options: Options): Promise<Blob> {
  const fileKey = `${Date.now()}-${transcodeSequence++}`;
  const inputFile = `sound-input-${fileKey}`;
  const exportFile = `sound-export-${fileKey}.${options.extension}`;

  return withFFmpeg(async (ffmpeg) => {
    await ffmpeg.writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

    // 文字化けを防ぐためにメタデータを抽出して付与し直す
    const metadata = await extractMetadataFromSound(file);

    await ffmpeg.exec([
      "-i",
      inputFile,
      "-metadata",
      `artist=${metadata.artist}`,
      "-metadata",
      `title=${metadata.title}`,
      "-vn",
      exportFile,
    ]);

    const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

    await Promise.allSettled([ffmpeg.deleteFile(inputFile), ffmpeg.deleteFile(exportFile)]);

    return new Blob([output]);
  });
}
