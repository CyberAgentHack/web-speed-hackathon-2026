import path from "path";

import Bluebird from "bluebird";
import { Router } from "express";
import kuromoji from "kuromoji";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

const DICT_PATH = path.resolve(
  import.meta.dirname,
  "../../../node_modules/kuromoji/dict",
);

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      const builder = kuromoji.builder({ dicPath: DICT_PATH }) as any;
      Bluebird.promisifyAll(builder);
      builder.buildAsync().then(resolve, reject);
    });
  }
  return tokenizerPromise;
}

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res
      .status(200)
      .type("application/json")
      .send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text.trim());
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return res
    .status(200)
    .type("application/json")
    .send({ score, label });
});
