import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router, type Response } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");
const STREAM_TTFT_MS = 80;
const STREAM_FULL_RESPONSE_DELAY_MS = 2000;
const STREAM_PREVIEW = "## 第六章：最終疾走と到達";

crokRouter.get("/crok/suggestions", async (req, res) => {
  const query = typeof req.query["q"] === "string" ? req.query["q"].trim().slice(0, 100) : "";
  if (query.length === 0) {
    return res.json({ suggestions: [] });
  }

  const suggestions = await QaSuggestion.findAll({
    attributes: ["question"],
    limit: 10,
    logging: false,
    where: {
      question: {
        [Op.like]: `%${query}%`,
      },
    },
  });
  return res.json({ suggestions: suggestions.map((s) => s.question) });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flushResponse(res: Response) {
  const streamingResponse = res as Response & { flush?: () => void };
  streamingResponse.flush?.();
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

  await sleep(STREAM_TTFT_MS);

  if (!res.closed) {
    const data = JSON.stringify({ replace: true, text: STREAM_PREVIEW, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
    flushResponse(res);
  }

  await sleep(STREAM_FULL_RESPONSE_DELAY_MS);

  if (!res.closed) {
    const data = JSON.stringify({ replace: true, text: response, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
    flushResponse(res);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
    flushResponse(res);
  }

  res.end();
});
