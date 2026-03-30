import { dump, insert, ImageIFD } from "piexifjs";

interface ConvertImageOptions {
  jpegQuality?: number;
  targetDisplayWidthPx?: number;
}

const DEFAULT_JPEG_QUALITY = 0.82;
const DEFAULT_TARGET_DISPLAY_WIDTH_PX = 720;
const MAX_OUTPUT_WIDTH_PX = 1600;

function bytesToBinaryString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
}

function binaryStringToBytes(binary: string): Uint8Array {
  return Uint8Array.from(binary.split("").map((c) => c.charCodeAt(0)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像データの読み込みに失敗しました"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

async function readImageDescription(blob: Blob): Promise<string | null> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const exif = (await import("piexifjs")).load(bytesToBinaryString(bytes));
  const raw = exif["0th"]?.[ImageIFD.ImageDescription] as string | undefined;
  if (raw == null) {
    return null;
  }
  return new TextDecoder().decode(binaryStringToBytes(raw));
}

function writeImageDescription(blob: Blob, description: string): Promise<Blob> {
  return (async () => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const binary = bytesToBinaryString(bytes);
    const descriptionBinary = bytesToBinaryString(new TextEncoder().encode(description));
    const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
    const outputWithExif = insert(exifStr, binary);
    return new Blob([binaryStringToBytes(outputWithExif)], { type: "image/jpeg" });
  })();
}

function createJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob == null) {
          reject(new Error("サムネイル画像の生成に失敗しました"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function createThumbnailByDisplaySize({
  blob,
  jpegQuality,
  targetDisplayWidthPx,
}: {
  blob: Blob;
  jpegQuality: number;
  targetDisplayWidthPx: number;
}): Promise<Blob> {
  const src = await blobToDataUrl(blob);
  const img = await loadImage(src);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const maxWidth = Math.max(
    1,
    Math.min(MAX_OUTPUT_WIDTH_PX, Math.ceil(Math.max(1, targetDisplayWidthPx) * dpr)),
  );

  if (img.naturalWidth <= maxWidth) {
    return blob;
  }

  const scale = maxWidth / img.naturalWidth;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    return blob;
  }

  ctx.drawImage(img, 0, 0, width, height);
  const resized = await createJpegBlob(canvas, jpegQuality);
  const description = await readImageDescription(blob);
  return description == null || description === ""
    ? resized
    : writeImageDescription(resized, description);
}

export async function convertImage(file: File, options: ConvertImageOptions = {}): Promise<Blob> {
  const jpegQuality = options.jpegQuality ?? DEFAULT_JPEG_QUALITY;
  const targetDisplayWidthPx =
    options.targetDisplayWidthPx ?? DEFAULT_TARGET_DISPLAY_WIDTH_PX;

  const [{ initializeImageMagick, ImageMagick, MagickFormat }, { default: magickWasm }] =
    await Promise.all([
      import("@imagemagick/magick-wasm"),
      import("@imagemagick/magick-wasm/magick.wasm?binary"),
    ]);

  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = MagickFormat.Jpg;

      const comment = img.comment;

      img.write((output) => {
        void (async () => {
          const outputBytes = output as Uint8Array;
          const normalizedBlob =
            comment == null
              ? new Blob([outputBytes], { type: "image/jpeg" })
              : await writeImageDescription(
                  new Blob([outputBytes], { type: "image/jpeg" }),
                  comment,
                );

          const thumbnail = await createThumbnailByDisplaySize({
            blob: normalizedBlob,
            jpegQuality,
            targetDisplayWidthPx,
          });
          resolve(thumbnail);
        })();
      });
    });
  });
}
