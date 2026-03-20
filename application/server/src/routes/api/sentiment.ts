import path from "node:path";
import { createRequire } from "node:module";

import type { Tokenizer, IpadicFeatures } from "kuromoji";
import { Hono } from "hono";

import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const require = createRequire(import.meta.url);

let tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerInstance) return tokenizerInstance;
  const kuromoji = await import("kuromoji").then((m) => m.default);
  const dicPath = path.resolve(path.dirname(require.resolve("kuromoji/package.json")), "dict");
  return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else {
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });
}

export const sentimentRouter = new Hono<SessionEnv>().get("/sentiment", async (c) => {
  const text = c.req.query("text");

  if (typeof text !== "string" || text.trim() === "") {
    return c.json({ score: 0, label: "neutral" as const });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  const { default: analyze } = await import("negaposi-analyzer-ja");
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return c.json({ score, label });
});
