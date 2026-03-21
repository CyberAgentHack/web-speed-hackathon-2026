import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import { getTokenizer, extractTokens } from "../src/utils/tokenizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const tokenizer = await getTokenizer();

  const seedPath = path.resolve(__dirname, "../seeds/qaSuggestions.jsonl");
  const rl = readline.createInterface({ input: fs.createReadStream(seedPath) });

  const results: { question: string; tokens: string[] }[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const { question } = JSON.parse(line) as { id: string; question: string };
    const tokens = extractTokens(tokenizer.tokenize(question));
    results.push({ question, tokens });
  }

  const outPath = path.resolve(__dirname, "../src/data/suggestions.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`Generated ${results.length} suggestion entries to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
