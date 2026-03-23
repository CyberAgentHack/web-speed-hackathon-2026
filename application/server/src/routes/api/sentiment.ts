import path from "node:path";
import { createRequire } from "node:module";

import Bluebird from "bluebird";
import { Router } from "express";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

export const sentimentRouter = Router();

const require = createRequire(import.meta.url);
const dicPath = path.join(path.dirname(require.resolve("kuromoji")), "..", "dict");

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = (async () => {
      const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath }));
      return await builder.buildAsync();
    })();
  }
  return tokenizerPromise;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
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
});
