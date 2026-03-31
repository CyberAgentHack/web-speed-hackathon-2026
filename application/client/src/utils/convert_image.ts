import { dump, ImageIFD, insert, load } from "piexifjs";
import * as UTIF from "utif";

export const MagickFormat = {
  Jpg: "jpg",
  Png: "png",
  WebP: "webp",
} as const;

export type MagickFormat = (typeof MagickFormat)[keyof typeof MagickFormat];

interface Options {
  extension: MagickFormat;
}

interface ExifPayload {
  "0th"?: Record<number, unknown>;
  Exif?: Record<number, unknown>;
  GPS?: Record<number, unknown>;
  Interop?: Record<number, unknown>;
}

function toBinary(bytes: Uint8Array<ArrayBuffer>): string {
  return Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
}

function fromBinary(binary: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(binary.split("").map((c) => c.charCodeAt(0)));
}

function extensionToMimeType(extension: MagickFormat): string {
  switch (extension) {
    case MagickFormat.Jpg:
      return "image/jpeg";
    case MagickFormat.Png:
      return "image/png";
    case MagickFormat.WebP:
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function isTiffFile(file: File, bytes: Uint8Array<ArrayBuffer>): boolean {
  if (file.type === "image/tiff" || file.type === "image/x-tiff") {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".tif") || lowerName.endsWith(".tiff")) {
    return true;
  }

  if (bytes.length < 4) {
    return false;
  }

  const isLittleEndianTiff = bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00;
  const isBigEndianTiff = bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a;
  return isLittleEndianTiff || isBigEndianTiff;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob == null) {
          reject(new Error("Failed to convert image"));
          return;
        }

        resolve(blob);
      },
      mimeType,
    );
  });
}

async function drawTiffToBlob(sourceBuffer: ArrayBuffer, mimeType: string): Promise<Blob> {
  const ifds = UTIF.decode(sourceBuffer);
  const firstIfd = ifds[0];

  if (firstIfd == null) {
    throw new Error("Failed to decode TIFF");
  }

  UTIF.decodeImage(sourceBuffer, firstIfd);
  const rgba = UTIF.toRGBA8(firstIfd);
  const width = Number((firstIfd as { width?: number; t256?: number }).width ?? firstIfd["t256"]);
  const height = Number((firstIfd as { height?: number; t257?: number }).height ?? firstIfd["t257"]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid TIFF dimensions");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx == null) {
    throw new Error("Failed to create canvas context");
  }

  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  ctx.putImageData(imageData, 0, 0);
  return await canvasToBlob(canvas, mimeType);
}

function readImageDescription(binary: string): string | undefined {
  try {
    const exif = load(binary) as { "0th"?: Record<number, unknown> };
    const description = exif["0th"]?.[ImageIFD.ImageDescription];

    if (typeof description !== "string" || description.length === 0) {
      return undefined;
    }

    return description;
  } catch {
    return undefined;
  }
}

function readExifPayload(binary: string): ExifPayload | undefined {
  try {
    const exif = load(binary) as ExifPayload;
    return {
      "0th": exif["0th"] != null ? { ...exif["0th"] } : undefined,
      Exif: exif.Exif != null ? { ...exif.Exif } : undefined,
      GPS: exif.GPS != null ? { ...exif.GPS } : undefined,
      Interop: exif.Interop != null ? { ...exif.Interop } : undefined,
    };
  } catch {
    return undefined;
  }
}

function normalizeDescriptionValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const normalized = value.replace(/\u0000+$/g, "");
    return normalized.length > 0 ? normalized : undefined;
  }

  if (value instanceof Uint8Array) {
    const normalized = new TextDecoder().decode(value).replace(/\u0000+$/g, "");
    return normalized.length > 0 ? normalized : undefined;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
    const normalized = new TextDecoder().decode(Uint8Array.from(value)).replace(/\u0000+$/g, "");
    return normalized.length > 0 ? normalized : undefined;
  }

  if (Array.isArray(value) && value.length === 1) {
    return normalizeDescriptionValue(value[0]);
  }

  return undefined;
}

function readTiffImageDescription(sourceBuffer: ArrayBuffer): string | undefined {
  try {
    const ifds = UTIF.decode(sourceBuffer);
    const firstIfd = ifds[0] as Record<string, unknown> | undefined;
    return normalizeDescriptionValue(firstIfd?.["t270"]);
  } catch {
    return undefined;
  }
}

function buildExifPayload(sourceExif: ExifPayload | undefined, description: string | undefined): ExifPayload | undefined {
  const payload: ExifPayload = {
    "0th": sourceExif?.["0th"] != null ? { ...sourceExif["0th"] } : {},
    Exif: sourceExif?.Exif != null ? { ...sourceExif.Exif } : undefined,
    GPS: sourceExif?.GPS != null ? { ...sourceExif.GPS } : undefined,
    Interop: sourceExif?.Interop != null ? { ...sourceExif.Interop } : undefined,
  };

  if (description != null && description.length > 0) {
    const descriptionBinary = toBinary(new TextEncoder().encode(description) as Uint8Array<ArrayBuffer>);
    payload["0th"] ??= {};
    payload["0th"][ImageIFD.ImageDescription] = descriptionBinary;
  }

  const has0th = payload["0th"] != null && Object.keys(payload["0th"]).length > 0;
  const hasExif = payload.Exif != null && Object.keys(payload.Exif).length > 0;
  const hasGps = payload.GPS != null && Object.keys(payload.GPS).length > 0;
  const hasInterop = payload.Interop != null && Object.keys(payload.Interop).length > 0;

  if (!has0th && !hasExif && !hasGps && !hasInterop) {
    return undefined;
  }

  return payload;
}

async function drawToBlob(file: File, sourceBuffer: ArrayBuffer, mimeType: string): Promise<Blob> {
  if (isTiffFile(file, new Uint8Array(sourceBuffer) as Uint8Array<ArrayBuffer>)) {
    return await drawTiffToBlob(sourceBuffer, mimeType);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");

    if (ctx == null) {
      throw new Error("Failed to create canvas context");
    }

    ctx.drawImage(image, 0, 0);

    return await canvasToBlob(canvas, mimeType);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const sourceBuffer = await file.arrayBuffer();
  const sourceBytes = new Uint8Array(sourceBuffer) as Uint8Array<ArrayBuffer>;
  const sourceBinary = toBinary(sourceBytes);
  const sourceExif = readExifPayload(sourceBinary);
  const description = readImageDescription(sourceBinary) ?? (isTiffFile(file, sourceBytes) ? readTiffImageDescription(sourceBuffer) : undefined);

  const mimeType = extensionToMimeType(options.extension);
  const convertedBlob = await drawToBlob(file, sourceBuffer, mimeType);
  const convertedBytes = new Uint8Array(await convertedBlob.arrayBuffer()) as Uint8Array<ArrayBuffer>;

  if (mimeType !== "image/jpeg") {
    return new Blob([convertedBytes], { type: mimeType });
  }

  const outputExif = buildExifPayload(sourceExif, description);

  if (outputExif == null) {
    return new Blob([convertedBytes], { type: mimeType });
  }

  try {
    const exifStr = dump(outputExif as Parameters<typeof dump>[0]);
    const outputWithExif = insert(exifStr, toBinary(convertedBytes));
    const outputBytes = fromBinary(outputWithExif);
    return new Blob([outputBytes], { type: mimeType });
  } catch {
    return new Blob([convertedBytes], { type: mimeType });
  }
}
