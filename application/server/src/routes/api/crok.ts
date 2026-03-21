import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BM25 } from "bayesian-bm25";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import { streamSSE } from "hono/streaming";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { getDb } from "@web-speed-hackathon-2026/server/src/db";
import { qaSuggestions } from "@web-speed-hackathon-2026/server/src/db/schema";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

const highlightedResponse = String(
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .processSync(response),
);

const require = createRequire(import.meta.url);

let tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerInstance) return tokenizerInstance;
  const kuromoji = await import("kuromoji").then((m) => m.default);
  const dicPath = path.resolve(path.dirname(require.resolve("kuromoji/package.json")), "dict");
  return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else {
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });
}

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

function filterSuggestionsBM25(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const scores = bm25.getScores(queryTokens) as number[];
  const results = candidates.map((text, i) => ({ text, score: scores[i]! }));

  return results
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);
}

export const crokRouter = new Hono<SessionEnv>()
  .get("/crok/suggestions", async (c) => {
    const db = getDb();
    const rows = db.select().from(qaSuggestions).all();
    const allSuggestions = rows.map((s) => s.question);

    const q = c.req.query("q");
    if (!q || !q.trim()) {
      return c.json({ suggestions: allSuggestions, queryTokens: [] });
    }

    const tokenizer = await getTokenizer();
    const queryTokens = extractTokens(tokenizer.tokenize(q));
    const filtered = filterSuggestionsBM25(tokenizer, allSuggestions, queryTokens);

    return c.json({ suggestions: filtered, queryTokens });
  })
  .get("/crok", async (c) => {
    const userId = c.var.session.get()?.userId;
    if (userId === undefined) {
      throw new HTTPException(401);
    }

    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return streamSSE(c, async (stream) => {
      let messageId = 0;

      for (const char of response) {
        if (stream.aborted) break;

        await stream.writeSSE({
          event: "message",
          id: String(messageId++),
          data: JSON.stringify({ text: char, done: false }),
        });
      }

      if (!stream.aborted) {
        await stream.writeSSE({
          event: "message",
          id: String(messageId),
          data: JSON.stringify({ text: "", done: true, highlighted: highlightedResponse }),
        });
      }
    });
  });
