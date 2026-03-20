import path from "path";
import { Router } from "express";
import httpErrors from "http-errors";
import kuromoji from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const sentimentRouter = Router();

sentimentRouter.post("/analyze", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const { text } = req.body;
  if (typeof text !== "string") {
    throw new httpErrors.BadRequest();
  }

  // kuromoji でトークン化（クライアント側と同じ字典を使用）
  const dicPath = path.join(PUBLIC_PATH, "dicts");
  const tokenizer = await new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>(
    (resolve, reject) => {
      kuromoji
        .builder({ dicPath })
        .build((err: Error | null, t?: kuromoji.Tokenizer<kuromoji.IpadicFeatures>) => {
          if (err) reject(err);
          else if (t) resolve(t);
        });
    }
  );

  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  const label = score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral";

  return res.status(200).type("application/json").send({ label, score });
});
