import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { PassThrough } from "stream";
import iconv from "iconv-lite";

interface SoundMetadata {
  artist?: string;
  title?: string;
}

ffmpeg.setFfmpegPath(ffmpegStatic as string);

// wav -> mp3
export async function convertSound(data: Buffer): Promise<Buffer> {
  const inStream = new PassThrough();
  inStream.end(data);

  const outChunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const ffmpegProc = ffmpeg(inStream)
      .inputFormat("wav")
      .audioCodec("libmp3lame")
      .format("mp3")
      .on("error", (err) => reject(err))
      .on("end", () => resolve(Buffer.concat(outChunks)))
      .pipe();

    ffmpegProc.on("data", (chunk) => outChunks.push(chunk));
  });
}

// wav からメタデータを抽出する
// アーティストとタイトルのみ対応
// wavにあるのはSHIFT_JISでエンコードされていることに注意
export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
    const inStream = new PassThrough();
    inStream.end(data);
    const outChunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
        ffmpeg(inStream)
            .inputFormat("wav")
            .format("ffmetadata")
            .on("error", (err) => reject(err))
            .on("end", () => {
                const metadataStr = Buffer.concat(outChunks).toString("binary");
                // console.log("Raw metadata string (binary):", metadataStr);
                const metadataStrUtf8 = iconv.decode(Buffer.from(metadataStr, "binary"), "shiftjis");
                // console.log("Metadata string after SHIFT_JIS decoding:", metadataStrUtf8);
                const metadata = parseFFmetadata(metadataStrUtf8);
                // console.log("Parsed metadata:", metadata);
                
                resolve({
                    artist: metadata.artist,
                    title: metadata.title,
                });
            })
            .pipe()
            .on("data", (chunk) => outChunks.push(chunk));
    })
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



// import { FFmpeg } from "@ffmpeg/ffmpeg";
// import Encoding from "encoding-japanese";

// export async function loadFFmpeg(): Promise<FFmpeg> {
//   const ffmpeg = new FFmpeg();

//   await ffmpeg.load();

//   return ffmpeg;
// }

// interface SoundMetadata {
//   artist: string;
//   title: string;
//   [key: string]: string;
// }

// const UNKNOWN_ARTIST = "Unknown Artist";
// const UNKNOWN_TITLE = "Unknown Title";

// export async function extractMetadataFromSound(data: File): Promise<SoundMetadata> {
//   try {
//     const ffmpeg = await loadFFmpeg();

//     const exportFile = "meta.txt";

//     await ffmpeg.writeFile("file", new Uint8Array(await data.arrayBuffer()));

//     await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", exportFile]);

//     const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

//     ffmpeg.terminate();

//     const outputUtf8 = Encoding.convert(output, {
//       to: "UNICODE",
//       from: "AUTO",
//       type: "string",
//     });

//     const meta = parseFFmetadata(outputUtf8);

//     return {
//       artist: meta.artist ?? UNKNOWN_ARTIST,
//       title: meta.title ?? UNKNOWN_TITLE,
//     };
//   } catch {
//     return {
//       artist: UNKNOWN_ARTIST,
//       title: UNKNOWN_TITLE,
//     };
//   }
// }

// function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
//   return Object.fromEntries(
//     ffmetadata
//       .split("\n")
//       .filter((line) => !line.startsWith(";") && line.includes("="))
//       .map((line) => line.split("="))
//       .map(([key, value]) => [key!.trim(), value!.trim()]),
//   ) as Partial<SoundMetadata>;
// }

// interface Options {
//   extension: string;
// }

// export async function convertSound(file: File, options: Options = { extension: "mp3" }): Promise<Uint8Array<ArrayBuffer>> {
//   const ffmpeg = await loadFFmpeg();

//   const exportFile = `export.${options.extension}`;

//   await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

//   // 文字化けを防ぐためにメタデータを抽出して付与し直す
//   const metadata = await extractMetadataFromSound(file);

//   await ffmpeg.exec([
//     "-i",
//     "file",
//     "-metadata",
//     `artist=${metadata.artist}`,
//     "-metadata",
//     `title=${metadata.title}`,
//     "-vn",
//     exportFile,
//   ]);

//   const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

//   ffmpeg.terminate();

//   return output;
// }