import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import type { Env } from "@web-speed-hackathon-2026/server/src/types";
import { unauthorized } from "@web-speed-hackathon-2026/server/src/utils/http_error";

export const crokRouter = new Hono<Env>();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (_c) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return _c.json({ suggestions: suggestions.map((s) => s.question) });
});

crokRouter.get("/crok", async (c) => {
  if (c.get("session").userId === undefined) {
    unauthorized();
  }

  c.header("Cache-Control", "no-cache, no-transform");

  return streamSSE(c, async (stream) => {
    let messageId = 0;

    // TTFT (Time to First Token)
    await stream.sleep(3000);

    for (const char of response) {
      if (stream.aborted) break;

      await stream.writeSSE({
        data: JSON.stringify({ text: char, done: false }),
        event: "message",
        id: String(messageId++),
      });

      await stream.sleep(10);
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
