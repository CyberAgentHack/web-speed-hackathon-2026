import { dump, insert, load, ImageIFD } from "piexifjs";

interface Options {
  extension: "image/jpeg";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.onload = () => resolve(image);
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob == null) {
        reject(new Error("Failed to encode image"));
        return;
      }
      resolve(blob);
    }, type);
  });
}

function decodeBinaryString(value: string): string {
  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBinaryString(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

async function getImageDescription(file: File): Promise<string | null> {
  try {
    const dataUrl = await blobToDataUrl(file);
    const exif = load(dataUrl);
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return typeof raw === "string" ? decodeBinaryString(raw) : null;
  } catch {
    return null;
  }
}

async function attachImageDescription(blob: Blob, description: string): Promise<Blob> {
  const dataUrl = await blobToDataUrl(blob);
  const exif = dump({ "0th": { [ImageIFD.ImageDescription]: encodeBinaryString(description) } });
  const outputWithExif = insert(exif, dataUrl);
  const response = await fetch(outputWithExif);
  return response.blob();
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const [image, description] = await Promise.all([loadImage(imageUrl), getImageDescription(file)]);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (context == null) {
      throw new Error("Failed to get canvas context");
    }

    context.drawImage(image, 0, 0);

    const converted = await canvasToBlob(canvas, options.extension);
    if (description == null || description === "") {
      return converted;
    };

    return attachImageDescription(converted, description);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
