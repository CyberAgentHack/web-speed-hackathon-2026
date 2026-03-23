import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(__dirname, "../../public/fonts");
const TERM_PAGE = resolve(__dirname, "../src/components/term/TermPage.tsx");

async function extractHeadingChars() {
  const source = await readFile(TERM_PAGE, "utf-8");
  const lines = source.split("\n");
  let collecting = false;
  let chars = "";

  for (const line of lines) {
    if (line.includes("font-[Rei_no_Are_Mincho]")) {
      collecting = true;
      continue;
    }
    if (collecting) {
      // Next line after the className line contains the heading text
      const text = line.replace(/<[^>]*>/g, "").trim();
      if (text) {
        chars += text;
        collecting = false;
      }
    }
  }

  const unique = [...new Set(chars)].join("");
  console.log(`Extracted ${unique.length} unique characters: ${unique}`);
  return unique;
}

async function main() {
  const chars = await extractHeadingChars();
  const fontBuffer = await readFile(resolve(FONTS_DIR, "ReiNoAreMincho-Heavy.otf"));

  const subset = await subsetFont(fontBuffer, chars, {
    targetFormat: "woff2",
  });

  const outPath = resolve(FONTS_DIR, "ReiNoAreMincho-Heavy-subset.woff2");
  await writeFile(outPath, subset);
  console.log(
    `Subset font written: ${(subset.byteLength / 1024).toFixed(1)} KB (was ${(fontBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`,
  );
}

main().catch(console.error);
