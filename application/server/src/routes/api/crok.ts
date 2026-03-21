import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { extractTokens, filterSuggestionsBM25 } from "@web-speed-hackathon-2026/server/src/utils/bm25_search";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
    if (err) {
      reject(err);
    } else {
      resolve(tokenizer);
    }
  });
});

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = typeof req.query["query"] === "string" ? req.query["query"] : "";
  const allSuggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = allSuggestions.map((s) => s.question);

  if (!query.trim()) {
    res.json({ suggestions: [], queryTokens: [] });
    return;
  }

  const tokenizer = await tokenizerPromise;
  const queryTokens = extractTokens(tokenizer.tokenize(query));
  const { suggestions } = filterSuggestionsBM25(tokenizer, candidates, queryTokens);

  res.json({ suggestions, queryTokens });
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
