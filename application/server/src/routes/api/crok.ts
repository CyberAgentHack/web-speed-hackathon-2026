import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/analyze_sentiment";
import {
  extractTokens,
  filterSuggestionsBM25,
} from "@web-speed-hackathon-2026/server/src/utils/bm25_search";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = (req.query["q"] as string) ?? "";

  if (!query.trim()) {
    res.json({ suggestions: [], queryTokens: [] });
    return;
  }

  const suggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = suggestions.map((s) => s.question);

  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(query));
  const results = filterSuggestionsBM25(tokenizer, candidates, queryTokens);

  res.json({ suggestions: results, queryTokens });
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
