import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TERM_HEADINGS } from "../src/components/term/TermPage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(__dirname, "../../public/fonts");

const chars = [...new Set(TERM_HEADINGS.join(""))].join("");

const input = path.join(FONTS_DIR, "ReiNoAreMincho-Heavy.otf");
const output = path.join(FONTS_DIR, "ReiNoAreMincho-Heavy-subset.woff2");

execFileSync(
  "pyftsubset",
  [input, `--text=${chars}`, `--output-file=${output}`, "--flavor=woff2"],
  {
    stdio: "inherit",
  },
);

console.log(`Created: ${output}`);
