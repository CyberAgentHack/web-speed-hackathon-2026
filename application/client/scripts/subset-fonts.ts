import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHARS = [
  ...new Set(
    [
      "利用規約",
      "第1条（適用）",
      "第2条（利用登録）",
      "第3条（ユーザーIDおよびパスワードの管理）",
      "第4条（利用料金および支払方法）",
      "第5条（禁止事項）",
      "第6条（本サービスの提供の停止等）",
      "第7条（著作権）",
      "第8条（利用制限および登録抹消）",
      "第9条（退会）",
      "第10条（保証の否認および免責事項）",
      "第11条（サービス内容の変更等）",
      "第12条（利用規約の変更）",
      "第13条（個人情報の取扱い）",
      "第14条（通知または連絡）",
      "第15条（権利義務の譲渡の禁止）",
      "第16条（準拠法・裁判管轄）",
    ].join(""),
  ),
].join("");

const FONTS_DIR = path.resolve(__dirname, "../../public/fonts");
const OUTPUT_DIR = FONTS_DIR;

async function main() {
  for (const name of ["ReiNoAreMincho-Regular", "ReiNoAreMincho-Heavy"]) {
    const inputPath = path.join(FONTS_DIR, `${name}.woff2`);
    const outputPath = path.join(OUTPUT_DIR, `${name}-subset.woff2`);

    const fontBuffer = fs.readFileSync(inputPath);
    const subset = await subsetFont(fontBuffer, CHARS, {
      targetFormat: "woff2",
    });

    fs.writeFileSync(outputPath, subset);
    const originalSize = (fontBuffer.length / 1024).toFixed(1);
    const subsetSize = (subset.length / 1024).toFixed(1);
    console.log(`${name}: ${originalSize}KB -> ${subsetSize}KB`);
  }
}

void main();
