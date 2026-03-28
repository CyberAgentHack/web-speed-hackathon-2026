import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

export const crokRouter = new Hono<AppEnv>();

crokRouter.get("/crok/suggestions", async (c) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return c.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.get("/crok", async (c) => {
  if (c.get("session").userId === undefined) {
    throw new HTTPException(401);
  }

  return streamSSE(c, async (stream) => {
    let messageId = 0;

    await stream.sleep(300);

    for (const char of response) {
      await stream.writeSSE({
        data: JSON.stringify({ text: char, done: false }),
        event: "message",
        id: String(messageId++),
      });
      await stream.sleep(10);
    }

    await stream.writeSSE({
      data: JSON.stringify({ text: "", done: true }),
      event: "message",
      id: String(messageId),
    });
  });
});
