import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import type { Context } from "hono";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = new Hono();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok/suggestions", async (_c: Context) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return _c.json({ suggestions: suggestions.map((s) => s.question) }, 200);
});

crokRouter.get("/crok", async (c: Context) => {
  const session = c.get("session" as never) as Record<string, unknown>;
  if (session["userId"] === undefined) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let responseText = "";
  let messageId = 0;

  await sleep(3000);

  for (const char of response) {
    const data = JSON.stringify({ text: char, done: false });
    responseText += `event: message\nid: ${messageId++}\ndata: ${data}\n\n`;
    await sleep(10);
  }

  const data = JSON.stringify({ text: "", done: true });
  responseText += `event: message\nid: ${messageId}\ndata: ${data}\n\n`;

  return c.text(responseText, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
