import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, '../../public/images');
const PROFILE_IMAGES_DIR = path.resolve(__dirname, '../../public/images/profiles');

async function convertDir(dir: string) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist.`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.jpg')) {
      const input = path.join(dir, file);
      const output = path.join(dir, file.replace('.jpg', '.webp'));
      if (fs.existsSync(output)) continue;
      
      console.log(`Converting ${input} to webp...`);
      try {
        await sharp(input).webp({ quality: 75 }).toFile(output);
      } catch (e: any) {
        console.error(`Failed to convert ${input}: ${e.message}`);
      }
    }
  }
}

async function run() {
  console.log('Starting conversion of public images...');
  await convertDir(PUBLIC_IMAGES_DIR);
  console.log('Starting conversion of profile images...');
  await convertDir(PROFILE_IMAGES_DIR);
  console.log('All conversions completed.');
}

run();
