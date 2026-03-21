import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");
const dicPath = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

let tokenizerPromise: Promise<any> | null = null;

async function getTokenizer(): Promise<any> {
  if (!tokenizerPromise) {
    tokenizerPromise = (async () => {
      const kuromoji = await import("kuromoji");
      return new Promise((resolve, reject) => {
        kuromoji.default.builder({ dicPath }).build((err: any, tokenizer: any) => {
          if (err) {
            tokenizerPromise = null;
            reject(err);
          } else {
            resolve(tokenizer);
          }
        });
      });
    })();
  }
  return tokenizerPromise;
}

function extractTokens(tokens: any[]): string[] {
  return tokens
    .filter((t: any) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t: any) => t.surface_form.toLowerCase());
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = req.query["q"] as string | undefined;
  const suggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = suggestions.map((s) => s.question);

  if (!query || !query.trim()) {
    res.json({ suggestions: candidates });
    return;
  }

  try {
    const { BM25 } = await import("bayesian-bm25");
    const tokenizer = await getTokenizer();
    const queryTokens = extractTokens(tokenizer.tokenize(query));

    if (queryTokens.length === 0) {
      res.json({ suggestions: [] });
      return;
    }

    const bm25 = new BM25({ k1: 1.2, b: 0.75 });
    const tokenizedCandidates = candidates.map((c: string) => extractTokens(tokenizer.tokenize(c)));
    bm25.index(tokenizedCandidates);

    const scores = bm25.getScores(queryTokens);
    const results = candidates.map((text: string, i: number) => ({ text, score: scores[i]! }));

    const filtered = results
      .filter((s: any) => s.score > 0)
      .sort((a: any, b: any) => a.score - b.score)
      .slice(-10)
      .map((s: any) => s.text);

    res.json({ suggestions: filtered });
  } catch {
    res.json({ suggestions: [] });
  }
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STREAM_TTFT_MS = 40;
const STREAM_CHUNK_INTERVAL_MS = 8;
const STREAM_CHUNK_SIZE = 160;

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
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
  await sleep(STREAM_TTFT_MS);

  for (const chunk of splitIntoChunks(response, STREAM_CHUNK_SIZE)) {
    if (res.closed) break;

    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    await sleep(STREAM_CHUNK_INTERVAL_MS);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
