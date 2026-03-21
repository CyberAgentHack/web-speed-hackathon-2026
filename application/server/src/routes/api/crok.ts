import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import { BM25 } from "bayesian-bm25";
import kuromoji from "kuromoji";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

// トークナイザーをキャッシュ
let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return cachedTokenizer;

  return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    const dicPath = path.join(PUBLIC_PATH, "dicts");
    kuromoji
      .builder({ dicPath })
      .build((err: Error | null, tokenizer?: Tokenizer<IpadicFeatures>) => {
        if (err) reject(err);
        else if (tokenizer) {
          cachedTokenizer = tokenizer;
          resolve(tokenizer);
        }
      });
  });
}

function extractTokens(
  tokens: IpadicFeatures[],
): string[] {
  const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

crokRouter.post("/crok/suggestions", async (req, res) => {
  const { query = "" } = req.body;

  const suggestions = await QaSuggestion.findAll({ logging: false });
  const questions = suggestions.map((s) => s.question);

  // クエリが空の場合は空の結果を返す
  if (!query.trim()) {
    return res.json({ suggestions: [], tokens: [] });
  }

  try {
    const tokenizer = await getTokenizer();

    // クエリをトークン化
    const queryTokens = extractTokens(tokenizer.tokenize(query));

    if (queryTokens.length === 0) {
      return res.json({ suggestions: [], tokens: [] });
    }

    // BM25 でスコアリング
    const bm25 = new BM25({ k1: 1.2, b: 0.75 });
    const tokenizedCandidates = questions.map((q) =>
      extractTokens(tokenizer.tokenize(q)),
    );
    bm25.index(tokenizedCandidates);

    const scores = bm25.getScores(queryTokens);
    const results = questions
      .map((text, i) => ({
        text,
        score: scores[i] ?? 0,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(-10)
      .map((s) => s.text);

    res.json({ suggestions: results, tokens: queryTokens });
  } catch (err) {
    throw new httpErrors.InternalServerError();
  }
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  // TTFT (Time to First Token)
  await sleep(3000);

  for (const char of response) {
    if (res.closed) break;

    const data = JSON.stringify({ text: char, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    await sleep(10);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
