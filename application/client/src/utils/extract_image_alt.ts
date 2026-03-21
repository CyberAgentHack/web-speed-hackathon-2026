import { ImageIFD, load } from "piexifjs";

const ALT_MAX_LENGTH = 500;
const BINARY_CHUNK_SIZE = 0x8000;

function toBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += BINARY_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BINARY_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
}

function decodeExifText(raw: string): string {
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes).replace(/\u0000/g, "").trim();
  if (decoded !== "") {
    return decoded;
  }

  return raw.replace(/\u0000/g, "").trim();
}

export async function extractImageAlt(file: File): Promise<string> {
  try {
    const binary = toBinaryString(await file.arrayBuffer());
    const exif = load(binary);
    const rawDescription = exif["0th"]?.[ImageIFD.ImageDescription];
    if (typeof rawDescription !== "string" || rawDescription.length === 0) {
      return "";
    }
    return decodeExifText(rawDescription).slice(0, ALT_MAX_LENGTH);
  } catch {
    return "";
  }
}
