import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/routes/api/tokenizer";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
});

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

crokRouter.post("/crok/suggestions/search", async (req, res) => {
  const { query } = req.body as { query: string };
  if (!query || !query.trim()) {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(query.trim());
  const queryTokens = tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());

  if (queryTokens.length === 0) {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  const allSuggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = allSuggestions.map((s) => s.question);

  // BM25 scoring (inline, lightweight)
  const k1 = 1.2;
  const b = 0.75;
  const N = candidates.length;

  const tokenizedDocs = candidates.map((c) => {
    const docTokens = tokenizer.tokenize(c);
    return docTokens
      .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
      .map((t) => t.surface_form.toLowerCase());
  });

  const avgDl = tokenizedDocs.reduce((sum, d) => sum + d.length, 0) / N;

  // Document frequency for each query token
  const df = new Map<string, number>();
  for (const qt of queryTokens) {
    let count = 0;
    for (const doc of tokenizedDocs) {
      if (doc.includes(qt)) count++;
    }
    df.set(qt, count);
  }

  const scores = tokenizedDocs.map((doc) => {
    let score = 0;
    const dl = doc.length;
    for (const qt of queryTokens) {
      const tf = doc.filter((t) => t === qt).length;
      const docFreq = df.get(qt) || 0;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgDl))));
    }
    return score;
  });

  const results = candidates
    .map((text, i) => ({ text, score: scores[i] ?? 0 }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

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
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }

    await sleep(10);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }
  }

  res.end();
});
