import path from "node:path";

import Bluebird from "bluebird";
import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const sentimentRouter = Router();

// 辞書の読み込み先
const DIC_PATH = path.join(PUBLIC_PATH, "dicts");

let tokenizer: Tokenizer<IpadicFeatures> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizer) {
    return tokenizer;
  }
  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: DIC_PATH }));
  tokenizer = await builder.buildAsync();
  return tokenizer!;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    throw new httpErrors.BadRequest("Query parameter 'q' is required");
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(query);
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
