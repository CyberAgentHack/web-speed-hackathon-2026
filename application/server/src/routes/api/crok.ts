import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import type { Context } from "hono";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = new Hono();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");
let suggestionCache: string[] | null = null;

export function clearCrokSuggestionCache() {
  suggestionCache = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok/suggestions", async (_c: Context) => {
  if (suggestionCache == null) {
    const suggestions = await QaSuggestion.findAll({
      attributes: ["question"],
      logging: false,
    });
    suggestionCache = suggestions.map((s) => s.question);
  }

  return _c.json({ suggestions: suggestionCache }, 200);
});

crokRouter.get("/crok", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let messageId = 0;

      await sleep(3000);

      for (const char of response) {
        const data = JSON.stringify({ text: char, done: false });
        controller.enqueue(encoder.encode(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`));
        await sleep(10);
      }

      const doneData = JSON.stringify({ text: "", done: true });
      controller.enqueue(encoder.encode(`event: message\nid: ${messageId}\ndata: ${doneData}\n\n`));
      controller.close();
    },
  });

  return c.newResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
