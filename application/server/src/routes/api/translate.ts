import { Hono } from "hono";
import * as v from "valibot";

import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const TranslateBody = v.object({
  text: v.string(),
  source: v.string(),
  target: v.string(),
});

export const translateRouter = new Hono<SessionEnv>().post("/translate", async (c) => {
  const body = v.parse(TranslateBody, await c.req.json());

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", body.source);
  url.searchParams.set("tl", body.target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", body.text);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return c.json({ error: "Translation failed" }, 500);
  }

  const data = await res.json();
  // Google Translate returns [[["translated text","original text",...],...],...]
  const translated = (data as unknown[][])[0]!
    .map((segment: unknown) => (segment as string[])[0])
    .join("");

  return c.json({ result: translated });
});
