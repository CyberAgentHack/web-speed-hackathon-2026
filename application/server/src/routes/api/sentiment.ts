import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type kuromoji from "kuromoji";

import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

const require = createRequire(import.meta.url);
const kuromojiLib = require("kuromoji") as typeof kuromoji;
const analyze = require("negaposi-analyzer-ja") as (tokens: kuromoji.IpadicFeatures[]) => number;

const dicPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../node_modules/kuromoji/dict",
);

let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;

function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizerPromise) return tokenizerPromise;
  tokenizerPromise = new Promise((resolve, reject) => {
    kuromojiLib.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
  return tokenizerPromise;
}

export const sentimentRouter = new Hono<AppEnv>();

sentimentRouter.post("/sentiment", async (c) => {
  const body = await c.req.json();
  const { text } = body as { text?: string };
  if (typeof text !== "string") {
    throw new HTTPException(400, { message: "text is required" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return c.json({ label, score }, 200);
});
