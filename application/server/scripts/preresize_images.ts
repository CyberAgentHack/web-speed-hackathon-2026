/**
 * 事前リサイズスクリプト: 全画像を指定幅にリサイズして保存する
 * 使い方: tsx scripts/preresize_images.ts
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const PUBLIC_PATH = path.resolve(import.meta.dirname, "../../public");

const SIZES = [64, 128, 200, 400];

async function resizeAll(dir: string) {
  const files = await fs.readdir(dir);
  // オリジナルの .avif ファイルのみ対象（既にリサイズ済みの _w*.avif は除外）
  const avifFiles = files.filter((f) => f.endsWith(".avif") && !f.includes("_w"));

  for (const file of avifFiles) {
    const srcPath = path.join(dir, file);
    const baseName = file.replace(".avif", "");

    for (const width of SIZES) {
      const outPath = path.join(dir, `${baseName}_w${width}.avif`);
      try {
        await fs.access(outPath);
        // 既にリサイズ済み => スキップ
      } catch {
        console.log(`Resizing ${file} -> width=${width}`);
        await sharp(srcPath)
          .resize(width)
          .avif({ quality: 40 })
          .toFile(outPath);
      }
    }
  }
}

async function main() {
  const imagesDir = path.join(PUBLIC_PATH, "images");
  const profilesDir = path.join(PUBLIC_PATH, "images", "profiles");

  console.log("Resizing images...");
  await resizeAll(imagesDir);
  console.log("Resizing profile images...");
  await resizeAll(profilesDir);
  console.log("Done!");
}

main().catch(console.error);
