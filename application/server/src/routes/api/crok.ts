import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

let cachedRenderedHtml: string | null = null;
async function getRenderedHtml(): Promise<string> {
  if (cachedRenderedHtml) return cachedRenderedHtml;
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(response);
  cachedRenderedHtml = String(result);
  return cachedRenderedHtml;
}
// Pre-render at startup
getRenderedHtml();

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;
function getCrokTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return Promise.resolve(cachedTokenizer);
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
      if (err) reject(err);
      else { cachedTokenizer = tokenizer; resolve(tokenizer); }
    });
  });
}

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

crokRouter.get("/crok/suggestions", async (_req, res) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.post("/crok/suggestions/filter", async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    return res.json({ suggestions: [], queryTokens: [] });
  }

  try {
    const tokenizer = await getCrokTokenizer();
    const queryTokens = extractTokens(tokenizer.tokenize(query));
    if (queryTokens.length === 0) {
      return res.json({ suggestions: [], queryTokens: [] });
    }

    const rows = await QaSuggestion.findAll({ logging: false });
    const candidates = rows.map((s) => s.question);

    const bm25 = new BM25({ k1: 1.2, b: 0.75 });
    const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
    bm25.index(tokenizedCandidates);
    const scores = bm25.getScores(queryTokens);
    const results = candidates
      .map((text, i) => ({ text, score: scores[i]! }))
      .filter((s) => s.score > 0)
      .sort((a, b) => a.score - b.score)
      .slice(-10)
      .map((s) => s.text);

    return res.json({ suggestions: results, queryTokens });
  } catch {
    return res.json({ suggestions: [], queryTokens: [] });
  }
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
    const html = await getRenderedHtml();
    const data = JSON.stringify({ text: "", done: true, html });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
