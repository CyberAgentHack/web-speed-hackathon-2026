import path from "path";

import { Router } from "express";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const sentimentRouter = Router();

type Tokenizer = {
  tokenize: (text: string) => object[];
};

let tokenizerPromise: Promise<Tokenizer> | null = null;

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      import("kuromoji").then(({ default: kuromoji }) => {
        kuromoji
          .builder({ dicPath: path.join(PUBLIC_PATH, "dicts") })
          .build((err: Error | null, tokenizer: Tokenizer) => {
            if (err) {
              tokenizerPromise = null;
              reject(err);
            } else {
              resolve(tokenizer);
            }
          });
      });
    });
  }
  return tokenizerPromise;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).json({ label: "neutral", score: 0 });
  }

  try {
    const [{ default: analyze }, tokenizer] = await Promise.all([
      import("negaposi-analyzer-ja"),
      getTokenizer(),
    ]);
    const tokens = tokenizer.tokenize(text);
    const score = analyze(tokens as Parameters<typeof analyze>[0]);

    let label: "positive" | "negative" | "neutral";
    if (score > 0.1) {
      label = "positive";
    } else if (score < -0.1) {
      label = "negative";
    } else {
      label = "neutral";
    }

    return res.status(200).json({ label, score });
  } catch {
    return res.status(200).json({ label: "neutral", score: 0 });
  }
});
