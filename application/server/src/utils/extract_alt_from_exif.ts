import piexif from "piexifjs";

export function extractAltFromExif(binary: Buffer): string {
  try {
    const exif = piexif.load(binary.toString("binary"));
    const raw = exif?.["0th"]?.[piexif.ImageIFD.ImageDescription];
    return raw != null ? Buffer.from(raw, "binary").toString("utf-8") : "";
  } catch {
    return "";
  }
}
