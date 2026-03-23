import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";
import analyze from "negaposi-analyzer-ja";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

// Cache suggestions in memory — they never change after seed
let cachedCandidates: string[] | null = null;
async function getCandidates(): Promise<string[]> {
  if (cachedCandidates === null) {
    const suggestions = await QaSuggestion.findAll({ logging: false });
    cachedCandidates = suggestions.map((s) => s.question);
  }
  return cachedCandidates;
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const candidates = await getCandidates();

  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    return res.json({ suggestions: candidates });
  }

  const tokenizer = await getTokenizer();
  const queryTokens = tokenizer
    .tokenize(q)
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());

  if (queryTokens.length === 0) {
    return res.json({ suggestions: [] });
  }

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = candidates.map((c) =>
    tokenizer
      .tokenize(c)
      .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
      .map((t) => t.surface_form.toLowerCase()),
  );
  bm25.index(tokenizedCandidates);

  const scores = bm25.getScores(queryTokens);
  const results = candidates
    .map((text, i) => ({ text, score: scores[i]! }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

  return res.json({ suggestions: results, queryTokens });
});

crokRouter.get("/crok/sentiment", async (req, res) => {
  const text = typeof req.query["text"] === "string" ? req.query["text"].trim() : "";
  if (!text) {
    return res.json({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) label = "positive";
  else if (score < -0.1) label = "negative";
  else label = "neutral";

  return res.json({ score, label });
});

const STREAM_CHUNK_SIZE = 160;
const STREAM_CHUNK_INTERVAL_MS = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  for (let i = 0; i < response.length; i += STREAM_CHUNK_SIZE) {
    if (res.closed) break;

    const chunk = response.slice(i, i + STREAM_CHUNK_SIZE);
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    if (i + STREAM_CHUNK_SIZE < response.length) {
      await sleep(STREAM_CHUNK_INTERVAL_MS);
    }
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
