import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { exiftool } from "exiftool-vendored";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    console.error("Unauthorized access to /api/v1/images");
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    console.error("Invalid request body for /api/v1/images: expected Buffer");
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  // ファイル名
  const filename = `${uuidv4()}.webp`;

  // exifを取得
  const [alt, _] = await Promise.all([
    getExifImageDescription(req.body, type.ext),
    convertAndSaveImage(req.body, filename),
  ]);

  return res.status(200).type("application/json").send({ id: filename, alt });
});

const convertAndSaveImage = async (
  data: Buffer,
  filename: string,
): Promise<void> => {
  // ディレクトリがなければ作成
  await mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  // webpに変換して保存
  await sharp(data)
    .resize(640) // 横幅640px
    .webp({
      quality: 75,
      smartSubsample: true,
    })
    .toFile(path.resolve(UPLOAD_PATH, `./images/${filename}`));
};

const getExifImageDescription = async (
  data: Buffer,
  ext: string,
): Promise<string | undefined> => {
  const tmpFilePath = path.resolve(UPLOAD_PATH, `./tmp/${uuidv4()}.${ext}`);
  // ディレクトリがなければ作成
  await mkdir(path.resolve(UPLOAD_PATH, "tmp"), { recursive: true });

  // ファイルに書き込む
  await writeFile(tmpFilePath, data);

  // exiftoolでEXIFデータを読み取る
  const tags = await exiftool.read(tmpFilePath);

  const alt = tags.ImageDescription;
  if (alt == null) {
    console.info("No EXIF data found in the uploaded image");
  }
  return alt;
};
