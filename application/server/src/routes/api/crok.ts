import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

export const crokRouter = new Hono<SessionEnv>();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (c) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return c.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.get("/crok", async (c) => {
  const userId = c.var.session.get()?.userId;
  if (userId === undefined) {
    throw new HTTPException(401);
  }

  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return streamSSE(c, async (stream) => {
    let messageId = 0;

    await stream.sleep(3000);

    for (const char of response) {
      if (stream.aborted) break;

      await stream.writeSSE({
        event: "message",
        id: String(messageId++),
        data: JSON.stringify({ text: char, done: false }),
      });

      await stream.sleep(10);
    }

    if (!stream.aborted) {
      await stream.writeSSE({
        event: "message",
        id: String(messageId),
        data: JSON.stringify({ text: "", done: true }),
      });
    }
  });
});
