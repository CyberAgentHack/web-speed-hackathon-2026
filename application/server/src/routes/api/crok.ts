import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import {
  extractTokens,
  filterSuggestionsBM25,
  tokenizerPromise,
} from "@web-speed-hackathon-2026/server/src/utils/kuromoji_tokenizer.js";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.get("/crok/suggestions/search", async (req, res) => {
  const q = req.query["q"];
  if (typeof q !== "string" || q.trim() === "") {
    return res.status(200).json({ suggestions: [] });
  }

  const [suggestionsData, tokenizer] = await Promise.all([
    QaSuggestion.findAll({ logging: false }),
    tokenizerPromise,
  ]);

  const candidates = (suggestionsData as QaSuggestion[]).map((s) => s.question);
  const queryTokens = extractTokens(tokenizer.tokenize(q));
  const results = filterSuggestionsBM25(tokenizer, candidates, queryTokens);

  return res.status(200).json({ suggestions: results, queryTokens });
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
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
