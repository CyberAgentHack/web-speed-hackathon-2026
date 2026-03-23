// シード画像の JPEG EXIF ImageDescription → SQLite Images.alt 更新スクリプト
// 使い方: node update-alt.cjs

const sharp = require("./node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js");
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.resolve(__dirname, "public/images");
const DB_PATH = path.resolve(__dirname, "server/database.sqlite");

/**
 * TIFF IFD から ImageDescription タグ (0x010E) を取得する。
 * sharp が返す metadata.exif は "Exif\0\0" (6バイト) プレフィックス付き。
 */
function parseExifAlt(buf) {
  // "Exif\0\0" プレフィックスをスキップ
  if (buf.length >= 6 && buf[0] === 0x45) {
    buf = buf.slice(6);
  }
  if (buf.length < 8) return "";
  const le = buf[0] === 0x49;
  const magic = le ? buf.readUInt16LE(2) : buf.readUInt16BE(2);
  if (magic !== 0x002a) return "";
  const ifd0Offset = le ? buf.readUInt32LE(4) : buf.readUInt32BE(4);
  if (ifd0Offset + 2 > buf.length) return "";
  const entryCount = le ? buf.readUInt16LE(ifd0Offset) : buf.readUInt16BE(ifd0Offset);
  for (let i = 0; i < entryCount; i++) {
    const base = ifd0Offset + 2 + i * 12;
    if (base + 12 > buf.length) break;
    const tag = le ? buf.readUInt16LE(base) : buf.readUInt16BE(base);
    if (tag !== 0x010e) continue;
    const type = le ? buf.readUInt16LE(base + 2) : buf.readUInt16BE(base + 2);
    if (type !== 2) break;
    const count = le ? buf.readUInt32LE(base + 4) : buf.readUInt32BE(base + 4);
    if (count === 0) break;
    const valueOffset = count <= 4 ? base + 8 : (le ? buf.readUInt32LE(base + 8) : buf.readUInt32BE(base + 8));
    if (valueOffset + count > buf.length) break;
    return buf.toString("utf8", valueOffset, valueOffset + count - 1);
  }
  return "";
}

(async () => {
  const db = new DatabaseSync(DB_PATH);
  const update = db.prepare('UPDATE "Images" SET "alt" = ? WHERE "id" = ?');

  const jpegFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith(".jpg"));
  console.log(`${jpegFiles.length} 件の JPEG を処理します`);

  let updated = 0;
  for (const file of jpegFiles) {
    const imageId = path.basename(file, ".jpg");
    const filePath = path.join(IMAGES_DIR, file);
    try {
      const metadata = await sharp(filePath).metadata();
      if (!metadata.exif) {
        console.log(`  skip (no exif): ${file}`);
        continue;
      }
      const alt = parseExifAlt(metadata.exif);
      if (!alt) {
        console.log(`  skip (no alt): ${file}`);
        continue;
      }
      const result = update.run(alt, imageId);
      if (result.changes > 0) {
        console.log(`  updated: ${imageId} → "${alt}"`);
        updated++;
      } else {
        console.log(`  not found in DB: ${imageId}`);
      }
    } catch (e) {
      console.error(`  error: ${file}`, e.message);
    }
  }

  db.close();
  console.log(`\n完了: ${updated} 件更新`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
