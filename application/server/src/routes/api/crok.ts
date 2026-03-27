import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");
const STREAM_CHUNK_SIZE = 64;

const chunkStreamText = (text: string): string[] => {
  const chunks: string[] = [];
  let buffer = "";

  for (const token of text.split(/(\s+)/).filter((t) => t.length > 0)) {
    if (token.length > STREAM_CHUNK_SIZE) {
      if (buffer.length > 0) {
        chunks.push(buffer);
        buffer = "";
      }
      for (let i = 0; i < token.length; i += STREAM_CHUNK_SIZE) {
        chunks.push(token.slice(i, i + STREAM_CHUNK_SIZE));
      }
      continue;
    }

    if (buffer.length > 0 && buffer.length + token.length > STREAM_CHUNK_SIZE) {
      chunks.push(buffer);
      buffer = "";
    }

    buffer += token;

    if (/[.!?。！？]\s*$/.test(buffer) && buffer.length >= Math.floor(STREAM_CHUNK_SIZE / 2)) {
      chunks.push(buffer);
      buffer = "";
    }
  }

  if (buffer.length > 0) {
    chunks.push(buffer);
  }

  return chunks;
};

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = req.query["q"];

  const where =
    typeof query === "string" && query.trim() !== ""
      ? { question: { [Op.like]: `%${query.trim()}%` } }
      : undefined;

  const suggestions = await QaSuggestion.findAll({
    logging: false,
    where,
    limit: 10,
    order: [["question", "ASC"]],
  });
  res.json({ suggestions: suggestions.map((s) => s.question) });
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

  for (const chunk of chunkStreamText(response)) {
    if (res.closed) break;

    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
