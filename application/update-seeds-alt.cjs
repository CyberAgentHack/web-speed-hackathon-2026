// seeds/images.jsonl の alt フィールドを JPEG EXIF から更新するスクリプト
// 使い方: node update-seeds-alt.cjs

const sharp = require("./node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js");
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.resolve(__dirname, "public/images");
const SEEDS_PATH = path.resolve(__dirname, "server/seeds/images.jsonl");

function parseExifAlt(buf) {
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
  // JPEG から alt マップを構築
  const altMap = {};
  const jpegFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith(".jpg"));
  for (const file of jpegFiles) {
    const id = path.basename(file, ".jpg");
    const metadata = await sharp(path.join(IMAGES_DIR, file)).metadata();
    if (metadata.exif) {
      const alt = parseExifAlt(metadata.exif);
      if (alt) altMap[id] = alt;
    }
  }

  // JSONL を読んで alt を差し替え
  const lines = fs.readFileSync(SEEDS_PATH, "utf8").trim().split("\n");
  const updated = lines.map(line => {
    const obj = JSON.parse(line);
    if (altMap[obj.id]) {
      obj.alt = altMap[obj.id];
    }
    return JSON.stringify(obj);
  });

  fs.writeFileSync(SEEDS_PATH, updated.join("\n") + "\n");
  console.log(`${Object.keys(altMap).length} 件の alt を seeds/images.jsonl に反映しました`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
