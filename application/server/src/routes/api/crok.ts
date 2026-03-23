import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

import { BM25 } from "bayesian-bm25";
import { getTokenizer, extractTokens } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = req.query["q"] as string | undefined;
  const suggestions = await QaSuggestion.findAll({ logging: false });
  const allQuestions = suggestions.map((s) => s.question);

  if (!query || !query.trim()) {
    return res.json({ suggestions: allQuestions });
  }

  try {
    const tokenizer = await getTokenizer();
    const queryTokens = extractTokens(tokenizer.tokenize(query));
    if (queryTokens.length === 0) {
      return res.json({ suggestions: allQuestions });
    }

    const bm25 = new BM25({ k1: 1.2, b: 0.75 });
    const tokenizedCandidates = allQuestions.map((q) => extractTokens(tokenizer.tokenize(q)));
    bm25.index(tokenizedCandidates);

    const scores = bm25.getScores(queryTokens);
    const results = allQuestions
      .map((text, i) => ({ text, score: scores[i] ?? 0 }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score) // Sort by highest score first
      .slice(0, 10)
      .map((s) => s.text);

    return res.json({ suggestions: results, queryTokens });
  } catch (error) {
    console.error("NLP processing error:", error);
    return res.json({ suggestions: allQuestions, queryTokens: [] });
  }
});



crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  // TTFT (Time to First Token) を意図的に遅延させていたコードを削除

  // 高速化のため、文字単位ではなくある程度まとめて送信（チャンク化）し、意図的なsleepを抑制
  const chunkSize = 100;
  for (let i = 0; i < response.length; i += chunkSize) {
    if (res.closed) break;
    
    const chunk = response.slice(i, i + chunkSize);
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
