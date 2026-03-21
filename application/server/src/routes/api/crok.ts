import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  const suggestions = await QaSuggestion.findAll({ attributes: ["question"], logging: false });
  res.json({ suggestions: suggestions.map((s) => s.question) });
});


const CHUNK_SIZE = 50;

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  // TypingIndicator の描画を保証するため、最初に空チャンクを送信
  {
    const data = JSON.stringify({ text: "", done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  for (let i = 0; i < response.length; i += CHUNK_SIZE) {
    if (res.closed) break;

    const text = response.slice(i, i + CHUNK_SIZE);
    const data = JSON.stringify({ text, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
