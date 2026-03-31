import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import {
  extractTokens,
  filterSuggestionsBM25,
  getTokenizer,
} from "@web-speed-hackathon-2026/server/src/utils/nlp";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

// In-memory cache for QaSuggestions
let cachedSuggestions: string[] = [];

export async function initializeCrokCache(): Promise<void> {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  cachedSuggestions = suggestions.map((s) => s.question);
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = typeof req.query["query"] === "string" ? req.query["query"].trim() : "";

  if (!query) {
    res.json({ suggestions: cachedSuggestions });
    return;
  }

  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(query));
  const filtered = filterSuggestionsBM25(tokenizer, cachedSuggestions, queryTokens);

  res.json({ suggestions: filtered, queryTokens });
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

  // TTFT (Time to First Token)

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
