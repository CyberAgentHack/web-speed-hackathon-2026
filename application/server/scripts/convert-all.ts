import sharp from 'sharp';
import fs from "node:fs";
import path from 'path';

const dir = path.resolve(import.meta.dirname, '../../public/images/profiles');
const files = fs.readdirSync(dir).filter(file => file.endsWith('.jpg'));

for (const file of files) {
  const input = path.join(dir, file);
  const output = path.join(dir, file.replace('.jpg', '.webp'));

  await sharp(input)
    .webp({ quality: 80 })
    .toFile(output);
}