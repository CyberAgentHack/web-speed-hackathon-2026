import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/routes/api/sentiment";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

crokRouter.get("/crok/suggestions", async (req, res) => {
  const q = req.query["q"];
  const suggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = suggestions.map((s) => s.question);

  if (typeof q !== "string" || q.trim() === "") {
    res.json({ suggestions: candidates, tokens: [] });
    return;
  }

  const tokenizer = await getTokenizer();
  const queryTokens = tokenizer
    .tokenize(q)
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());

  if (queryTokens.length === 0) {
    res.json({ suggestions: [], tokens: [] });
    return;
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
  const results = candidates.map((text, i) => ({ text, score: scores[i] as number }));

  const filtered = results
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

  res.json({ suggestions: filtered, tokens: queryTokens });
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

  const chunkSize = 200;
  for (let i = 0; i < response.length; i += chunkSize) {
    if (res.closed) break;
    const chunk = response.slice(i, i + chunkSize);
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
    await sleep(10);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
