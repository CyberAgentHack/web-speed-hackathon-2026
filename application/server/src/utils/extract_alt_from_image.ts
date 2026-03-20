import piexif from "piexifjs";

const MAX_ALT_LENGTH = 255;

export function extractAltFromImage(data: Buffer): string {
  try {
    const binary = data.toString("binary");
    const exifData = piexif.load(binary);
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
