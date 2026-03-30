import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import Bluebird from "bluebird";
import kuromoji from "kuromoji";
import { extractTokens, filterSuggestionsBM25 } from "../../utils/bm25_search";
import { DICTS_PATH } from "../../paths";
import chunk from "lodash.chunk";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = req.query["q"] && decodeURI(req.query["q"] as string);

  if(typeof query !== "string" || query === undefined) {
    throw new httpErrors.BadRequest();
  }

  const suggestions = await QaSuggestion.findAll({ logging: false });
  const questions = suggestions.map((sug) => sug.question);

  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: DICTS_PATH }));
  const tokenizer = await builder.buildAsync();

  const tokens = extractTokens(tokenizer.tokenize(query));
  const filtered = filterSuggestionsBM25(tokenizer, questions, tokens);

  return res
    .status(200)
    .type("application/json")
    .json({
      tokens,
      suggestions: filtered,
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

  const chunks = chunk(response, 200);

  console.log("Streaming the token:", response.length);
  for (const chunk of chunks) {
    if (res.closed) break;

    const data = JSON.stringify({ text: chunk.join(""), done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
    console.log("Streamed", messageId)

    await sleep(100);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
