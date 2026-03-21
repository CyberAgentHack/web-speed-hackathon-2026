import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer.js";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

function extractTokens(tokens: { surface_form: string; pos: string }[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  const allQuestions = suggestions.map((s) => s.question);

  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.json({ suggestions: allQuestions, queryTokens: [] });
  }

  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(query));

  if (queryTokens.length === 0) {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = allQuestions.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const scores = bm25.getScores(queryTokens);
  const results = allQuestions.map((text, i) => ({ text, score: scores[i]! }));

  const filtered = results
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

  return res.json({ suggestions: filtered, queryTokens });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHUNK_SIZE = 5;

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  const chars = [...response];
  for (let i = 0; i < chars.length; i += CHUNK_SIZE) {
    if (res.closed) break;

    const chunk = chars.slice(i, i + CHUNK_SIZE).join("");
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    await sleep(1);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
