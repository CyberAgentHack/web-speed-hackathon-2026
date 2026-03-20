import { promises as fs } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { ImageMagick, initializeImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const require = createRequire(import.meta.url);
const { dump, ImageIFD, insert } = require("piexifjs") as typeof import("piexifjs");

// 変換した画像の拡張子
const EXTENSION = "jpg";
const MAGICK_WASM_PATH = fileURLToPath(import.meta.resolve("@imagemagick/magick-wasm/magick.wasm"));
const imageMagickInitialized = fs
  .readFile(MAGICK_WASM_PATH)
  .then((wasm) => initializeImageMagick(new Uint8Array(wasm)));

function restoreImageDescription(output: Buffer, comment: string): Buffer {
  const binary = output.toString("binary");
  const descriptionBinary = Buffer.from(comment, "utf-8").toString("binary");
  const exifStr = dump({
    "0th": { [ImageIFD.ImageDescription]: descriptionBinary },
  });
  const outputWithExif = insert(exifStr, binary);
  return Buffer.from(outputWithExif, "binary");
}

async function convertImageToJpegWithAlt(input: Buffer): Promise<{ alt: string; converted: Buffer }> {
  await imageMagickInitialized;

  return await new Promise((resolve, reject) => {
    try {
      ImageMagick.read(new Uint8Array(input), (img) => {
        try {
          img.format = MagickFormat.Jpg;
          const alt = img.comment ?? "";

          img.write((output) => {
            try {
              const converted = Buffer.from(output as Uint8Array<ArrayBuffer>);
              resolve({
                alt,
                converted: alt === "" ? converted : restoreImageDescription(converted, alt),
              });
            } catch (error) {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }
  const body = req.body;

  const type = await fileTypeFromBuffer(body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const { alt, converted } = await convertImageToJpegWithAlt(body);
  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, converted);
  await Image.create({ alt, id: imageId });

  return res.status(200).type("application/json").send({ alt, id: imageId });
});
