import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { filterSuggestionsBM25 } from "@web-speed-hackathon-2026/server/src/utils/bm25_search";

const response = readFileSync(resolve(process.cwd(), "src/routes/api/crok-response.md"), "utf-8");

export const crokRouter = Router();

crokRouter.get("/crok/suggestions", async (req, res) => {
  const allSuggestions = await QaSuggestion.findAll({ logging: false });
  const candidates = allSuggestions.map((s) => s.question);

  const query = req.query["q"];
  if (typeof query === "string" && query.trim()) {
    const result = await filterSuggestionsBM25(candidates, query);
    return res.json(result);
  }

  return res.json({ suggestions: candidates });
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
