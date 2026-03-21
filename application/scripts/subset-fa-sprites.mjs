#!/usr/bin/env node
/**
 * Font Awesome SVG スプライトのサブセット化スクリプト
 * 実際に使用しているアイコンのみを抽出して sprite ファイルを小さくする
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const spritesDir = join(__dirname, '../public/sprites/font-awesome');

const USED_ICONS = {
  solid: [
    'arrow-down',
    'arrow-right',
    'balance-scale',
    'circle-notch',
    'edit',
    'envelope',
    'exclamation-circle',
    'home',
    'images',
    'music',
    'paper-plane',
    'pause',
    'play',
    'search',
    'sign-in-alt',
    'user',
    'video',
  ],
  regular: ['calendar-alt'],
  brands: [], // 未使用
};

const FA_LICENSE = `<!--
Font Awesome Free 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
-->`;

function extractSymbol(svgContent, iconId) {
  // <symbol id="icon-id" ...>...</symbol> を抽出
  const regex = new RegExp(
    `<symbol[^>]+id="${iconId}"[^>]*>[\\s\\S]*?</symbol>`,
    'g'
  );
  const match = svgContent.match(regex);
  return match ? match[0] : null;
}

function buildSprite(symbols) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${FA_LICENSE}\n<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n  ${symbols.join('\n  ')}\n</svg>\n`;
}

for (const [style, icons] of Object.entries(USED_ICONS)) {
  const filePath = join(spritesDir, `${style}.svg`);
  let originalContent;
  try {
    originalContent = readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`Skipping ${style}.svg (not found)`);
    continue;
  }

  const originalSize = Buffer.byteLength(originalContent, 'utf8');

  if (icons.length === 0) {
    // 未使用スタイルは最小の空スプライトにする
    const empty = `<?xml version="1.0" encoding="UTF-8"?>\n${FA_LICENSE}\n<svg xmlns="http://www.w3.org/2000/svg" style="display: none;"></svg>\n`;
    writeFileSync(filePath, empty, 'utf8');
    const newSize = Buffer.byteLength(empty, 'utf8');
    console.log(`${style}.svg: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB`);
    continue;
  }

  const symbols = [];
  const missing = [];

  for (const iconId of icons) {
    const symbol = extractSymbol(originalContent, iconId);
    if (symbol) {
      symbols.push(symbol);
    } else {
      missing.push(iconId);
    }
  }

  if (missing.length > 0) {
    console.warn(`[${style}] Missing icons: ${missing.join(', ')}`);
  }

  const newContent = buildSprite(symbols);
  writeFileSync(filePath, newContent, 'utf8');

  const newSize = Buffer.byteLength(newContent, 'utf8');
  console.log(
    `${style}.svg: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB  (${symbols.length}/${icons.length} icons)`
  );
}
