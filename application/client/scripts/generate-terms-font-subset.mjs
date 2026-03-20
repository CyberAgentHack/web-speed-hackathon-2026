import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import subsetFont from 'subset-font';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientRoot = path.resolve(__dirname, '..');
const termPagePath = path.join(clientRoot, 'src/components/term/TermPage.tsx');
const sourceFontPath = path.resolve(
  clientRoot,
  '../public/fonts/ReiNoAreMincho-Heavy.otf',
);
const outputFontPath = path.resolve(
  clientRoot,
  '../public/fonts/ReiNoAreMincho-Heavy-TermsSubset.woff2',
);

const termPageSource = await readFile(termPagePath, 'utf8');
const headingRegex = /<h[12][^>]*>\s*([^<\n]+)\s*<\/h[12]>/g;
const headingTexts = [...termPageSource.matchAll(headingRegex)].map((match) =>
  match[1].trim(),
);

if (headingTexts.length === 0) {
  throw new Error('No h1/h2 heading text found in TermPage.tsx');
}

const glyphText = [...new Set(headingTexts.join(''))].join('');
const sourceFont = await readFile(sourceFontPath);
const subsetFontBuffer = await subsetFont(sourceFont, glyphText, {
  targetFormat: 'woff2',
});

await writeFile(outputFontPath, subsetFontBuffer);

console.log(
  `Generated ${path.basename(outputFontPath)} from ${headingTexts.length} headings.`,
);
console.log(`Glyph count: ${glyphText.length}`);
console.log(`Output bytes: ${subsetFontBuffer.byteLength}`);
