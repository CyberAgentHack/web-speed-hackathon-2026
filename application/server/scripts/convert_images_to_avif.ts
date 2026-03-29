import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicImagesDir = path.resolve(rootDir, "public/images");
const uploadImagesDir = path.resolve(rootDir, "upload/images");

async function convertDir(dir: string) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await convertDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".jpg") || entry.name.endsWith(".jpeg"))) {
      const outputName = entry.name.replace(/\.(jpg|jpeg)$/, ".avif");
      const outputPath = path.join(dir, outputName);

      console.log(`Converting ${fullPath} to ${outputPath}...`);
      try {
        await sharp(fullPath).toFormat("avif").toFile(outputPath);
        // 元のファイルを削除するかは運用次第だが、ディスク容量節約のため削除を推奨
        // fs.unlinkSync(fullPath); 
      } catch (err) {
        console.error(`Failed to convert ${fullPath}:`, err);
      }
    }
  }
}

async function main() {
  console.log("Starting conversion to AVIF...");
  await convertDir(publicImagesDir);
  await convertDir(uploadImagesDir);
  console.log("Conversion finished.");
}

main().catch(console.error);
