import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

let tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerInstance != null) {
    return Promise.resolve(tokenizerInstance);
  }
  if (tokenizerPromise != null) {
    return tokenizerPromise;
  }
  tokenizerPromise = new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.join(PUBLIC_PATH, "dicts") })
      .build((err, built) => {
        if (err != null) {
          tokenizerPromise = null;
          reject(err);
        } else {
          tokenizerInstance = built;
          resolve(built);
        }
      });
  });
  return tokenizerPromise;
}

function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

function filterSuggestionsBM25(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  return candidates
    .map((text, idx) => ({ text, score: bm25.getScores(queryTokens)[idx] ?? 0 }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const all = await QaSuggestion.findAll({ logging: false });
  const candidates = all.map((s) => s.question);

  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (q === "") {
    res.json({ suggestions: candidates });
    return;
  }

  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(q));
  const suggestions = filterSuggestionsBM25(tokenizer, candidates, queryTokens);
  res.json({ suggestions });
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
