import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";

export const crokRouter = new Hono();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (c) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return c.json({ suggestions: suggestions.map((s) => s.question) });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok", async (c) => {
  const userId = getSession(c);
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  return streamSSE(c, async (stream) => {
    let messageId = 0;

    // TTFT (Time to First Token)
    await sleep(3000);

    for (const char of response) {
      if (stream.aborted) break;

      await stream.writeSSE({
        data: JSON.stringify({ text: char, done: false }),
        event: "message",
        id: String(messageId++),
      });

      await sleep(10);
    }

    if (!stream.aborted) {
      await stream.writeSSE({
        data: JSON.stringify({ text: "", done: true }),
        event: "message",
        id: String(messageId),
      });
    }
  });
});
