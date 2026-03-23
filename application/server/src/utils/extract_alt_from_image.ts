import piexif from "piexifjs";
import sharp from "sharp";

const MAX_ALT_LENGTH = 255;

export async function extractAltFromImage(data: Buffer): Promise<string> {
  try {
    // まず piexifjs で直接読む (JPEG の場合)
    try {
      const binary = data.toString("binary");
      const exifData = piexif.load(binary);
      const description = exifData["0th"]?.[piexif.ImageIFD.ImageDescription];
      if (typeof description === "string") {
        const bytes = Uint8Array.from(description.split("").map((c: string) => c.charCodeAt(0)));
        const decoded = new TextDecoder().decode(bytes);
        return decoded.slice(0, MAX_ALT_LENGTH);
      }
    } catch {
      // JPEG でない場合は失敗する — 次のフォールバックへ
    }

    // WebP 等: sharp で EXIF 付き JPEG に変換してから piexifjs で読む
    const jpegBuf = await sharp(data).keepExif().jpeg().toBuffer();
    const jpegBinary = jpegBuf.toString("binary");
    const exifData = piexif.load(jpegBinary);
    const description = exifData["0th"]?.[piexif.ImageIFD.ImageDescription];
    if (typeof description === "string") {
      const bytes = Uint8Array.from(description.split("").map((c: string) => c.charCodeAt(0)));
      const decoded = new TextDecoder().decode(bytes);
      return decoded.slice(0, MAX_ALT_LENGTH);
    }
    return "";
  } catch {
    return "";
  }
}
