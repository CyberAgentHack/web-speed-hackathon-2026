import path from "path";
import { Router } from "express";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

export const sentimentRouter = Router();

// Singleton: tokenizerを一度だけ初期化する
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      const dicPath = path.join(import.meta.dirname, "../../../../public/dicts");
      import("kuromoji").then(({ default: kuromoji }) => {
        kuromoji.builder({ dicPath }).build((err, tokenizer) => {
          if (err) {
            tokenizerPromise = null;
            reject(err);
          } else {
            resolve(tokenizer);
          }
        });
      }).catch(reject);
    });
  }
  return tokenizerPromise;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).type("application/json").send({ label: "neutral", score: 0 });
  }

  try {
    const [tokenizer, { default: analyze }] = await Promise.all([
      getTokenizer(),
      import("negaposi-analyzer-ja"),
    ]);

    const tokens = tokenizer.tokenize(text);
    const score = analyze(tokens);

    let label: "positive" | "negative" | "neutral";
    if (score > 0.1) {
      label = "positive";
    } else if (score < -0.1) {
      label = "negative";
    } else {
      label = "neutral";
    }

    return res.status(200).type("application/json").send({ score, label });
  } catch {
    return res.status(200).type("application/json").send({ label: "neutral", score: 0 });
  }
});
