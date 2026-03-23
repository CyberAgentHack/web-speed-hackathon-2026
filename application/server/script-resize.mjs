import fs from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Since `package.json` in root uses pnpm workspaces, and server has sharp
// We will run this script from the server directory or dynamically import sharp.
import sharp from "sharp";

async function processDirectory(dirPath, targetWidth) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
        if (!file.endsWith(".jpg") && !file.endsWith(".png")) continue;

        const base = path.parse(file).name;
        const sourcePath = path.join(dirPath, file);
        const webpPath = path.join(dirPath, `${base}.webp`);
      
        const p = sharp(sourcePath);
      
        await p
            .clone()
            .resize({ width: targetWidth, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(webpPath);
      
        console.log(`Processed ${file} -> .webp`);
    }
}

async function main() {
    const publicImages = path.resolve(__dirname, "application/public/images");
    const publicProfiles = path.resolve(__dirname, "application/public/images/profiles");

    await processDirectory(publicImages, 800);
    await processDirectory(publicProfiles, 128);
}

main().catch(console.error);
