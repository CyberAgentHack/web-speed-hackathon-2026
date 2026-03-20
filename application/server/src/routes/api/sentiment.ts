import { Router } from "express";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

export const sentimentRouter = Router();

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return Promise.resolve(cachedTokenizer);
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
      if (err) {
        reject(err);
      } else {
        cachedTokenizer = tokenizer;
        resolve(tokenizer);
      }
    });
  });
}

sentimentRouter.post("/sentiment", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
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

    return res.status(200).json({ score, label });
  } catch {
    return res.status(500).json({ error: "Sentiment analysis failed" });
  }
});
