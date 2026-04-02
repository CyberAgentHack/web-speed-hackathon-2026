import sharp from 'sharp';
import fs from "node:fs";
import path from 'path';

// 通常画像
const imagesDir = path.resolve(import.meta.dirname, '../../public/images');
const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.webp'));

for (const file of imageFiles) {
  const filePath = path.join(imagesDir, file);
  const tmp = path.join(imagesDir, `tmp_${file}`);
  console.log(`Recompressing ${file} ...`);
  await sharp(filePath)
    .resize(800, undefined, { withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(tmp);
  fs.renameSync(tmp, filePath);
}

// プロフィール画像
const profileDir = path.resolve(import.meta.dirname, '../../public/images/profiles');
const profileFiles = fs.readdirSync(profileDir).filter(file => file.endsWith('.webp'));

for (const file of profileFiles) {
  const filePath = path.join(profileDir, file);
  const tmp = path.join(profileDir, `tmp_${file}`);
  console.log(`Recompressing ${file} ...`);
  await sharp(filePath)
    .resize(200, undefined, { withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(tmp);
  fs.renameSync(tmp, filePath);
}

console.log("Done!");
