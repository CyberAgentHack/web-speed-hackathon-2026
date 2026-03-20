import fs from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import {
  extractTokens,
  filterSuggestionsBM25,
} from "../../utils/extract_tokens";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(
  path.join(__dirname, "crok-response.md"),
  "utf-8",
);

const builder = kuromoji.builder({
  dicPath: join(__dirname, "/dicts"),
});
const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>(
  (resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) {
        reject(err);
      } else {
        resolve(tokenizer);
      }
    });
  },
);

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = req.query["q"];
  if (typeof query !== "string") {
    res.json({ suggestions: [] });
    return;
  }

  const candidates = await QaSuggestion.findAll({ logging: false });

  const tokens = extractTokens(tokenizer.tokenize(query));
  const suggestions = filterSuggestionsBM25(
    tokenizer,
    candidates.map((s) => s.question),
    tokens,
  );

  res.json({ suggestions, tokens });
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

crokRouter.get("/negaposi", async (req, res) => {
  const query = req.query["q"];
  if (typeof query !== "string") {
    res.json({ suggestions: [] });
    return;
  }

  const tokens = tokenizer.tokenize(query);
  const score = analyze(tokens);

  if (score > 0.1) {
    return res.json({ label: "positive" });
  } else if (score < -0.1) {
    return res.json({ label: "negative" });
  } else {
    return res.json({ label: "neutral" });
  }
});
