import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVIES_DIR = path.resolve(__dirname, '../../public/movies');

const files = fs.readdirSync(MOVIES_DIR).filter(f => f.endsWith('.webp'));

for (const file of files) {
  const input = path.join(MOVIES_DIR, file);
  const output = path.join(MOVIES_DIR, file.replace('.webp', '_thumb.jpg'));
  if (fs.existsSync(output)) {
    console.log(`Skipped (exists): ${output}`);
    continue;
  }
  await sharp(input, { pages: 1 })
    .jpeg({ quality: 85 })
    .toFile(output);
  console.log(`Generated: ${output}`);
}

console.log('Done.');
