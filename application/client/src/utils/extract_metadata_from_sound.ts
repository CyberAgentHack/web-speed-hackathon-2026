import { loadFFmpeg } from "@web-speed-hackathon-2026/client/src/utils/load_ffmpeg";

interface SoundMetadata {
  artist: string;
  title: string;
  [key: string]: string;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

/**
 * 音声ファイルからFFmpegでメタデータ（artist/title）を抽出する。
 * encoding-japaneseは446KBと大きいため、初期バンドルに含めずdynamic importで遅延ロードする。
 */
export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
  try {
    const ffmpeg = await loadFFmpeg();
    const { default: Encoding } = await import("encoding-japanese");

    const exportFile = "meta.txt";

    await ffmpeg.writeFile("file", new Uint8Array(await data.arrayBuffer()));

    await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", exportFile]);

    const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

    ffmpeg.terminate();

    const outputUtf8 = Encoding.convert(output, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });

    const meta = parseFFmetadata(outputUtf8);

    return {
      artist: meta.artist ?? UNKNOWN_ARTIST,
      title: meta.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  ) as Partial<SoundMetadata>;
}
