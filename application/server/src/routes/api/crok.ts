import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise == null) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: path.join(PUBLIC_PATH, "dicts") }).build((err, tokenizer) => {
        if (err != null || tokenizer == null) {
          reject(err ?? new Error("failed to initialize kuromoji tokenizer"));
          return;
        }

        resolve(tokenizer);
      });
    });
  }

  return await tokenizerPromise;
}

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const tokenizer = await getTokenizer();
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({
    suggestions: suggestions.map((s) => {
      const text = s.question;
      return {
        text,
        tokens: extractTokens(tokenizer.tokenize(text)),
      };
    }),
  });
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
