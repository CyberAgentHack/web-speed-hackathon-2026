import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const responsePath = path.join(__dirname, "crok-response.md");
let cachedResponse: string | null = null;

async function getResponse(): Promise<string> {
  if (cachedResponse === null) {
    cachedResponse = await fs.readFile(responsePath, "utf-8");
  }
  return cachedResponse;
}

let cachedSuggestions: string[] | null = null;

crokRouter.get("/crok/suggestions", async (_req, res) => {
  if (!cachedSuggestions) {
    const suggestions = await QaSuggestion.findAll({ logging: false });
    cachedSuggestions = suggestions.map((s) => s.question);
  }
  res.json({ suggestions: cachedSuggestions });
});

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const response = await getResponse();

  let messageId = 0;

  const CHUNK_SIZE = 100;
  for (let i = 0; i < response.length; i += CHUNK_SIZE) {
    if (res.closed) break;

    const chunk = response.slice(i, i + CHUNK_SIZE);
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
