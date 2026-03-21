import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// kuromoji トークナイザーをシングルトンで初期化
const require_ = createRequire(import.meta.url);
const dicPath = path.dirname(require_.resolve("kuromoji/dict/base.dat.gz"));

const tokenizerReady: Promise<Tokenizer<IpadicFeatures>> = new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath }).build((err, tokenizer) => {
    if (err) reject(err);
    else resolve(tokenizer);
  });
});
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/sentiment", async (req, res) => {
  const text = req.query["text"];
  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text query parameter is required");
  }

  const tokenizer = await tokenizerReady;
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  res.json({ score, label });
});

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
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

  for (const char of response) {
    if (res.closed) break;

    const data = JSON.stringify({ text: char, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    await sleep(1);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
