import fs from "node:fs/promises";
import path from "node:path";

import { Router } from "express";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractExifDescription } from "@web-speed-hackathon-2026/server/src/utils/extract_exif_description";

import { initializeSequelize } from "../../sequelize";
import { sessionStore } from "../../session";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  sessionStore.clear();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  // 画像の EXIF から ALT テキストを抽出して DB に反映
  const images = await Image.findAll({ attributes: ["id"] });
  for (const image of images) {
    const jpegPath = path.resolve(PUBLIC_PATH, "images", `${image.id}.jpg`);
    try {
      const buf = await fs.readFile(jpegPath);
      const alt = extractExifDescription(buf);
      if (alt) {
        await image.update({ alt });
      }
    } catch {
      // ファイルが存在しない場合はスキップ
    }
  }

  return res.status(200).type("application/json").send({});
});
