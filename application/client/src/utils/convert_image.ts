import piexif from "piexifjs";

export interface ConvertedImage {
  blob: Blob;
  alt: string;
}

const FALLBACK_ALT = "";

let encoderPromise: Promise<(imageData: ImageData) => Promise<ArrayBuffer>> | null = null;

async function getAvifEncoder() {
  if (encoderPromise != null) {
    return encoderPromise;
  }

  encoderPromise = import("@jsquash/avif")
    .then((module) => module.encode)
    .catch((error: unknown) => {
      encoderPromise = null;
      throw error;
    });

  return encoderPromise;
}

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (context == null) {
    bitmap.close();
    throw new Error("Failed to get 2D context.");
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

async function readDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image as data URL."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image metadata."));
    reader.readAsDataURL(file);
  });
}

function normalizeAlt(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function readAltText(file: File): Promise<string> {
  try {
    const dataUrl = await readDataUrl(file);
    const exif = piexif.load(dataUrl);
    const imageDescription = normalizeAlt(exif["0th"]?.[piexif.ImageIFD.ImageDescription]);
    if (imageDescription != null) {
      return imageDescription;
    }
  } catch {
    // Ignore EXIF read failure and fallback to default text
  }

  return FALLBACK_ALT;
}

export async function convertImage(file: File): Promise<ConvertedImage> {
  const [encode, imageData, alt] = await Promise.all([
    getAvifEncoder(),
    fileToImageData(file),
    readAltText(file),
  ]);
  const encoded = await encode(imageData);
  return {
    blob: new Blob([encoded], { type: "image/avif" }),
    alt,
  };
}
