import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Disable sharp cache to release file handles promptly
sharp.cache(false);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVIES_DIR = path.resolve(__dirname, '../../public/movies');
const GIFS_DIR = MOVIES_DIR; // GIF source files are in the same directory

const files = fs.readdirSync(MOVIES_DIR).filter(f => f.endsWith('.webp') && !f.includes('_thumb'));

for (const file of files) {
  const webpPath = path.join(MOVIES_DIR, file);
  const beforeSize = fs.statSync(webpPath).size;

  // Write to a temp file in system temp dir to avoid Windows file lock issues
  const tmpPath = path.join(os.tmpdir(), `recompress_${file}`);

  await sharp(webpPath, { animated: true })
    .webp({ quality: 55, effort: 4 })
    .toFile(tmpPath);

  const afterSize = fs.statSync(tmpPath).size;

  if (afterSize < beforeSize) {
    fs.copyFileSync(tmpPath, webpPath);
    const saved = Math.round((1 - afterSize / beforeSize) * 100);
    console.log(`${file}: ${Math.round(beforeSize / 1024)}KB → ${Math.round(afterSize / 1024)}KB (-${saved}%)`);
  } else {
    console.log(`${file}: skipped (would grow ${Math.round(beforeSize / 1024)}KB → ${Math.round(afterSize / 1024)}KB)`);
  }

  fs.unlinkSync(tmpPath);
}

console.log('Done.');
