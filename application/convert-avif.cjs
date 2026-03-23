// シード画像 JPEG → AVIF 変換スクリプト
// 使い方: node convert-avif.cjs

const sharp = require("./node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js");
const fs = require("fs");
const path = require("path");

const DIRS = [
  path.resolve(__dirname, "public/images"),
  path.resolve(__dirname, "public/images/profiles"),
];

async function convertDir(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg"));
  console.log(`${dir}: ${files.length} files`);

  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(".jpg", ".avif"));

    if (fs.existsSync(output)) {
      console.log(`  skip: ${file} (already exists)`);
      continue;
    }

    await sharp(input)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .avif({ quality: 60 })
      .toFile(output);

    console.log(`  done: ${file} → ${path.basename(output)}`);
  }
}

(async () => {
  for (const dir of DIRS) {
    await convertDir(dir);
  }
  console.log("完了");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
