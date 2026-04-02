import fs from "node:fs";
import piexif from "piexifjs/piexif.js";

export function extractAltFromImage(filePath: string): string {
  try {
    const data = fs.readFileSync(filePath, "binary");
    const exif = piexif.load(data);
    const raw = exif["0th"]?.[piexif.ImageIFD.ImageDescription];
    return raw != null ? Buffer.from(raw, "binary").toString("utf-8") : "";
  } catch {
    return "";
  }
}
