import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";
import type { IpadicFeatures, Tokenizer } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

// kuromojiシングルトン
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;
function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      const dicPath = path.join(__dirname, "../../../../public/dicts");
      import("kuromoji").then(({ default: kuromoji }) => {
        kuromoji.builder({ dicPath }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
          if (err) {
            tokenizerPromise = null;
            reject(err);
          } else {
            resolve(tokenizer);
          }
        });
      }).catch(reject);
    });
  }
  return tokenizerPromise;
}

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.get("/crok/suggestions/search", async (req, res) => {
  const q = req.query["q"];
  if (typeof q !== "string" || q.trim() === "") {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  const [tokenizer, suggestionsData] = await Promise.all([
    getTokenizer(),
    QaSuggestion.findAll({ logging: false }),
  ]);

  const candidates: string[] = suggestionsData.map((s) => s.question);
  const queryTokens = extractTokens(tokenizer.tokenize(q));

  if (queryTokens.length === 0) {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = candidates.map((c: string) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);
  const scores: number[] = bm25.getScores(queryTokens);
  const results = candidates
    .map((text: string, i: number) => ({ text, score: scores[i] ?? 0 }))
    .filter((s: { text: string; score: number }) => s.score > 0)
    .sort((a: { score: number }, b: { score: number }) => a.score - b.score)
    .slice(-10)
    .map((s: { text: string }) => s.text);

  return res.json({ suggestions: results, queryTokens });
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
