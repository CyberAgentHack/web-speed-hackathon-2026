import { runFFmpeg } from "@web-speed-hackathon-2026/server/src/utils/run_ffmpeg";

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface ConvertSoundResult {
  buffer: Buffer;
  artist: string;
  title: string;
}

function parseRiffInfo(input: Buffer): { artist?: string; title?: string } {
  const result: { artist?: string; title?: string } = {};
  if (input.length < 12) return result;
  const riff = input.subarray(0, 4).toString("ascii");
  const wave = input.subarray(8, 12).toString("ascii");
  if (riff !== "RIFF" || wave !== "WAVE") return result;

  let offset = 12;
  while (offset + 8 <= input.length) {
    const chunkId = input.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = input.readUInt32LE(offset + 4);
    offset += 8;

    if (chunkId === "LIST" && offset + 4 <= input.length) {
      const listType = input.subarray(offset, offset + 4).toString("ascii");
      if (listType === "INFO") {
        let pos = offset + 4;
        const end = offset + chunkSize;
        const decoder = new TextDecoder("shift_jis");
        while (pos + 8 <= end && pos + 8 <= input.length) {
          const subId = input.subarray(pos, pos + 4).toString("ascii");
          const subSize = input.readUInt32LE(pos + 4);
          pos += 8;
          if (pos + subSize > input.length) break;
          const data = input.subarray(pos, pos + subSize);
          let trimmed = data;
          while (trimmed.length > 0 && trimmed[trimmed.length - 1] === 0) {
            trimmed = trimmed.subarray(0, trimmed.length - 1);
          }
          const text = decoder.decode(trimmed);
          if (subId === "INAM") result.title = text;
          if (subId === "IART") result.artist = text;
          pos += subSize;
          if (subSize % 2) pos++;
        }
      }
    }

    offset += chunkSize;
    if (chunkSize % 2) offset++;
  }
  return result;
}

export async function convertSound(input: Buffer): Promise<ConvertSoundResult> {
  let artist = UNKNOWN_ARTIST;
  let title = UNKNOWN_TITLE;

  const info = parseRiffInfo(input);
  if (info.artist) artist = info.artist;
  if (info.title) title = info.title;

  const buffer = await runFFmpeg(
    input,
    ["-metadata", `artist=${artist}`, "-metadata", `title=${title}`, "-vn"],
    "mp3",
  );

  return { buffer, artist, title };
}
