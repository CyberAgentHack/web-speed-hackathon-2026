import type { MagickFormat } from "@imagemagick/magick-wasm";
import { dump, insert, ImageIFD } from "piexifjs";

const workerSelf = self as unknown as {
  onmessage: (event: MessageEvent<ConvertImageRequest>) => void;
  postMessage: (message: ConvertImageSuccessResponse | ConvertImageErrorResponse, transfer?: Transferable[]) => void;
};

type ConvertImageRequest = {
  id: number;
  type: "convert";
  fileBuffer: ArrayBuffer;
  extension: MagickFormat;
};

type ConvertImageSuccessResponse = {
  id: number;
  type: "success";
  outputBuffer: ArrayBuffer;
};

type ConvertImageErrorResponse = {
  id: number;
  type: "error";
  message: string;
};

let initializePromise: Promise<void> | undefined;

async function ensureImageMagickInitialized(): Promise<void> {
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    const [{ initializeImageMagick }, { default: magickWasm }] = await Promise.all([
      import("@imagemagick/magick-wasm"),
      import("@imagemagick/magick-wasm/magick.wasm?binary"),
    ]);

    await initializeImageMagick(magickWasm);
  })();

  return initializePromise;
}

async function convertImage(fileBuffer: ArrayBuffer, extension: MagickFormat): Promise<ArrayBuffer> {
  await ensureImageMagickInitialized();
  const { ImageMagick } = await import("@imagemagick/magick-wasm");

  return await new Promise((resolve) => {
    ImageMagick.read(new Uint8Array(fileBuffer), (img) => {
      img.format = extension;
      const comment = img.comment;

      img.write((output) => {
        const bytes = output as Uint8Array<ArrayBuffer>;

        if (comment == null) {
          resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
          return;
        }

        const binary = Array.from(bytes)
          .map((b) => String.fromCharCode(b))
          .join("");
        const descriptionBinary = Array.from(new TextEncoder().encode(comment))
          .map((b) => String.fromCharCode(b))
          .join("");

        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);
        const outputBytes = Uint8Array.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));

        resolve(outputBytes.buffer);
      });
    });
  });
}

workerSelf.onmessage = async (event: MessageEvent<ConvertImageRequest>) => {
  const request = event.data;
  if (request.type !== "convert") {
    return;
  }

  try {
    const outputBuffer = await convertImage(request.fileBuffer, request.extension);
    const response: ConvertImageSuccessResponse = {
      id: request.id,
      type: "success",
      outputBuffer,
    };
    workerSelf.postMessage(response, [outputBuffer]);
  } catch (error) {
    const response: ConvertImageErrorResponse = {
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    workerSelf.postMessage(response);
  }
};
