import { Router } from "express";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import path from "path";

export const sentimentRouter = Router();

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return Promise.resolve(cachedTokenizer);

  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: path.resolve(import.meta.dirname, "../../../node_modules/kuromoji/dict") }).build((err, tokenizer) => {
      if (err) return reject(err);
      cachedTokenizer = tokenizer;
      resolve(tokenizer);
    });
  });
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];
  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  const { default: analyze } = await import("negaposi-analyzer-ja");
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
